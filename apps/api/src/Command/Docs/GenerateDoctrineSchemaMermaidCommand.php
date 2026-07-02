<?php

declare(strict_types=1);

namespace App\Command\Docs;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Mapping\ClassMetadata;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'app:docs:generate-mermaid-schema',
    description: 'Generate the Mermaid ER diagram from Doctrine mapping.',
)]
final class GenerateDoctrineSchemaMermaidCommand extends Command
{
    private const ENTITY_NAME_OVERRIDES = [
        'app_user' => 'USER',
        'invite_tokens' => 'INVITE_TOKEN',
        'password_reset_tokens' => 'PASSWORD_RESET_TOKEN',
    ];

    private const TABLE_ORDER = [
        'app_user' => 10,
        'vendor' => 20,
        'couple' => 30,
        'wedding' => 40,
        'style' => 50,
        'culture' => 60,
        'confession' => 70,
        'region' => 80,
        'service' => 90,
        'offer' => 100,
        'portfolio_image' => 110,
        'booking_blocker' => 120,
        'plan' => 130,
        'subscription' => 140,
        'invite_tokens' => 150,
        'password_reset_tokens' => 160,
        'vendor_venue_details' => 170,
        'vendor_catering_details' => 180,
        'vendor_animation_details' => 190,
        'vendor_creator_details' => 200,
        'creator_value' => 210,
    ];

    private const TYPE_OVERRIDES = [
        'smallint' => 'int',
        'integer' => 'int',
        'bigint' => 'int',
    ];

    private const RESERVED_ENTITY_NAMES = [
        'STYLE' => true,
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('check', null, InputOption::VALUE_NONE, 'Fail if generated docs are not up to date.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $repoRoot = dirname($this->projectDir, 2);
        $schemaPath = $repoRoot . '/docs/wedly_schema_v3.mmd';
        $previewPath = $repoRoot . '/docs/schema-preview.md';

        $mermaid = $this->generateMermaid();
        $preview = $this->generatePreviewMarkdown($mermaid);

        if ($input->getOption('check')) {
            $outdatedFiles = [];

            if (!is_file($schemaPath) || file_get_contents($schemaPath) !== $mermaid) {
                $outdatedFiles[] = $this->relativePath($repoRoot, $schemaPath);
            }

            if (!is_file($previewPath) || file_get_contents($previewPath) !== $preview) {
                $outdatedFiles[] = $this->relativePath($repoRoot, $previewPath);
            }

            if ($outdatedFiles !== []) {
                $io->error(sprintf(
                    "Doctrine schema docs are out of date:\n- %s\n\nRun: cd apps/api && composer docs:schema",
                    implode("\n- ", $outdatedFiles),
                ));

                return Command::FAILURE;
            }

            $io->success('Doctrine schema docs are up to date.');

            return Command::SUCCESS;
        }

        file_put_contents($schemaPath, $mermaid);
        file_put_contents($previewPath, $preview);

        $io->success(sprintf(
            "Generated Doctrine schema docs:\n- %s\n- %s",
            $this->relativePath($repoRoot, $schemaPath),
            $this->relativePath($repoRoot, $previewPath),
        ));

        return Command::SUCCESS;
    }

    private function generateMermaid(): string
    {
        $metadata = $this->getOrderedMetadata();
        $lines = ['erDiagram'];
        $relations = $this->generateRelationLines($metadata);

        foreach ($relations as $relation) {
            $lines[] = '    ' . $relation;
        }

        foreach ($metadata as $classMetadata) {
            $lines[] = '';
            $lines[] = sprintf('    %s {', $this->entityName($classMetadata));

            foreach ($this->generateFieldLines($classMetadata) as $fieldLine) {
                $lines[] = '        ' . $fieldLine;
            }

            $lines[] = '    }';
        }

        return implode("\n", $lines) . "\n";
    }

    private function generatePreviewMarkdown(string $mermaid): string
    {
        return <<<MARKDOWN
# Wedly Schema Preview

Generated from Doctrine mapping.

Run this command after entity mapping changes:

```bash
cd apps/api && composer docs:schema
```

```mermaid
$mermaid```

MARKDOWN;
    }

    /**
     * @return list<ClassMetadata<object>>
     */
    private function getOrderedMetadata(): array
    {
        /** @var list<ClassMetadata<object>> $metadata */
        $metadata = array_values(array_filter(
            $this->entityManager->getMetadataFactory()->getAllMetadata(),
            static fn (ClassMetadata $classMetadata): bool => !$classMetadata->isMappedSuperclass,
        ));

        usort(
            $metadata,
            static fn (ClassMetadata $left, ClassMetadata $right): int => [
                self::TABLE_ORDER[$left->getTableName()] ?? 1000,
                $left->getTableName(),
            ] <=> [
                self::TABLE_ORDER[$right->getTableName()] ?? 1000,
                $right->getTableName(),
            ],
        );

        return $metadata;
    }

    /**
     * @param list<ClassMetadata<object>> $metadata
     *
     * @return list<string>
     */
    private function generateRelationLines(array $metadata): array
    {
        $relations = [];
        $seen = [];

        foreach ($metadata as $sourceMetadata) {
            foreach ($sourceMetadata->associationMappings as $associationMapping) {
                if (!$associationMapping->isOwningSide()) {
                    continue;
                }

                $targetMetadata = $this->entityManager->getClassMetadata($associationMapping->targetEntity);
                $sourceEntity = $this->entityName($sourceMetadata);
                $targetEntity = $this->entityName($targetMetadata);
                $label = $this->toSnakeCase($associationMapping->fieldName);

                if ($associationMapping->isManyToMany()) {
                    $relation = sprintf('%s }o--o{ %s : %s', $sourceEntity, $targetEntity, $label);
                } elseif ($associationMapping->isManyToOne()) {
                    $relation = sprintf('%s ||--o{ %s : %s', $targetEntity, $sourceEntity, $label);
                } elseif ($associationMapping->isOneToOne()) {
                    $relation = sprintf('%s ||--o| %s : %s', $targetEntity, $sourceEntity, $label);
                } else {
                    continue;
                }

                if (isset($seen[$relation])) {
                    continue;
                }

                $seen[$relation] = true;
                $relations[] = $relation;
            }
        }

        return $relations;
    }

    /**
     * @param ClassMetadata<object> $classMetadata
     *
     * @return list<string>
     */
    private function generateFieldLines(ClassMetadata $classMetadata): array
    {
        $identifierFields = array_flip($classMetadata->getIdentifierFieldNames());
        $fieldLines = [];
        $seenColumns = [];

        foreach ($classMetadata->fieldMappings as $fieldMapping) {
            if (!isset($identifierFields[$fieldMapping->fieldName])) {
                continue;
            }

            $this->appendFieldLine($fieldLines, $seenColumns, $fieldMapping->type, $fieldMapping->columnName);
        }

        foreach ($classMetadata->associationMappings as $associationMapping) {
            if (!$associationMapping->isToOneOwningSide()) {
                continue;
            }

            $targetMetadata = $this->entityManager->getClassMetadata($associationMapping->targetEntity);
            $identifierFieldNames = $targetMetadata->getIdentifierFieldNames();
            $identifierType = 'uuid';

            if ($identifierFieldNames !== []) {
                $identifierMapping = $targetMetadata->getFieldMapping($identifierFieldNames[0]);
                $identifierType = $identifierMapping->type;
            }

            foreach ($associationMapping->joinColumns as $joinColumn) {
                $this->appendFieldLine($fieldLines, $seenColumns, $identifierType, $joinColumn->name);
            }
        }

        foreach ($classMetadata->fieldMappings as $fieldMapping) {
            if (isset($identifierFields[$fieldMapping->fieldName])) {
                continue;
            }

            $this->appendFieldLine($fieldLines, $seenColumns, $fieldMapping->type, $fieldMapping->columnName);
        }

        return $fieldLines;
    }

    /**
     * @param list<string>        $fieldLines
     * @param array<string, true> $seenColumns
     */
    private function appendFieldLine(array &$fieldLines, array &$seenColumns, string $type, string $columnName): void
    {
        if (isset($seenColumns[$columnName])) {
            return;
        }

        $seenColumns[$columnName] = true;
        $fieldLines[] = sprintf('%s %s', $this->normalizeType($type), $columnName);
    }

    /**
     * @param ClassMetadata<object> $classMetadata
     */
    private function entityName(ClassMetadata $classMetadata): string
    {
        $tableName = $classMetadata->getTableName();
        $entityName = self::ENTITY_NAME_OVERRIDES[$tableName] ?? strtoupper($tableName);

        if (isset(self::RESERVED_ENTITY_NAMES[$entityName]) || !preg_match('/^[A-Z][A-Z0-9_]*$/', $entityName)) {
            return sprintf('"%s"', $entityName);
        }

        return $entityName;
    }

    private function normalizeType(string $type): string
    {
        return self::TYPE_OVERRIDES[$type] ?? $type;
    }

    private function toSnakeCase(string $value): string
    {
        $snake = preg_replace('/(?<!^)[A-Z]/', '_$0', $value);

        return strtolower($snake ?? $value);
    }

    private function relativePath(string $repoRoot, string $path): string
    {
        return ltrim(str_replace($repoRoot, '', $path), '/');
    }
}
