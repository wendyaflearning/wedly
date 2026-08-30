<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use Doctrine\ORM\Mapping\Column;
use PHPUnit\Framework\TestCase;

/**
 * Doctrine hydrates the mutable `date`/`datetime` types into `\DateTime`, which a
 * property typed `\DateTimeImmutable` cannot accept. The mismatch is invisible until
 * a row is actually read back from the database, so it is asserted on the mapping.
 */
final class DateTimeMappingTest extends TestCase
{
    private const MUTABLE_TYPES = ['date', 'datetime', 'datetimetz', 'time'];

    /**
     * @return iterable<string, array{class-string, string}>
     */
    public static function immutableDateTimeProperties(): iterable
    {
        foreach (self::entityClasses() as $class) {
            foreach ((new \ReflectionClass($class))->getProperties() as $property) {
                $type = $property->getType();

                if (!$type instanceof \ReflectionNamedType) {
                    continue;
                }

                if (\DateTimeImmutable::class !== ltrim($type->getName(), '\\')) {
                    continue;
                }

                yield sprintf('%s::$%s', $class, $property->getName()) => [$class, $property->getName()];
            }
        }
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('immutableDateTimeProperties')]
    public function test_immutable_properties_never_use_a_mutable_doctrine_type(
        string $class,
        string $property,
    ): void {
        $attributes = (new \ReflectionProperty($class, $property))->getAttributes(Column::class);

        if ([] === $attributes) {
            // No explicit column: Doctrine infers the type from the property itself.
            $this->assertTrue(true);

            return;
        }

        $declaredType = $attributes[0]->newInstance()->type;

        $this->assertNotContains(
            $declaredType,
            self::MUTABLE_TYPES,
            sprintf(
                '%s::$%s is a \DateTimeImmutable but is mapped as "%s"; use "%s_immutable" instead.',
                $class,
                $property,
                (string) $declaredType,
                $declaredType,
            ),
        );
    }

    public function test_the_scan_actually_finds_entity_properties(): void
    {
        $this->assertNotEmpty(iterator_to_array(self::immutableDateTimeProperties()));
    }

    /**
     * @return list<class-string>
     */
    private static function entityClasses(): array
    {
        $directory = new \RecursiveDirectoryIterator(__DIR__ . '/../../../src/Entity');
        $classes = [];

        /** @var \SplFileInfo $file */
        foreach (new \RecursiveIteratorIterator($directory) as $file) {
            if ('php' !== $file->getExtension()) {
                continue;
            }

            $contents = (string) file_get_contents($file->getPathname());

            if (
                1 !== preg_match('/^namespace\s+([^;]+);/m', $contents, $namespace)
                || 1 !== preg_match('/^(?:final\s+)?(?:readonly\s+)?class\s+(\w+)/m', $contents, $className)
            ) {
                continue;
            }

            $fqcn = $namespace[1] . '\\' . $className[1];

            if (class_exists($fqcn)) {
                $classes[] = $fqcn;
            }
        }

        return $classes;
    }
}
