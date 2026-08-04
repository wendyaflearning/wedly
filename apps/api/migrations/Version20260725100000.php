<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260725100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[WED-74] Insert missing services coordinatrice-mariage and tailleur-homme';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at)
            VALUES
                ('019f98c0-f692-727b-85b8-29d39ed0fa3f', 'Coordinatrice de mariage', 'coordinatrice-mariage', 12, 'freelance', NULL, NOW(), NOW()),
                ('019f98c0-f692-73b7-85b8-29d39f874a6f', 'Tailleur homme',            'tailleur-homme',          13, 'freelance', NULL, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE FROM service WHERE slug IN ('coordinatrice-mariage', 'tailleur-homme')");
    }
}
