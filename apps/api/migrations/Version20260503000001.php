<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260503000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed "Aucune spécialité religieuse" in confession and "Aucune spécialité culturelle" in culture';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            INSERT INTO confession (id, name, slug, created_at, updated_at) VALUES
                ('019da0ec-d800-7004-8004-000000000009', 'Aucune spécialité religieuse', 'aucune-specialite-religieuse', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO culture (id, name, slug, type, created_at, updated_at) VALUES
                ('019da0ec-d800-7003-8003-00000000001c', 'Aucune spécialité culturelle', 'aucune-specialite-culturelle', 'autre', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
