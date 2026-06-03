<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260603000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop creator_specialty column (captured by Professions step) and seed Respect value';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_creator_details DROP COLUMN IF EXISTS creator_specialty');

        $this->addSql(<<<'SQL'
            INSERT INTO creator_value (id, name, slug, created_at, updated_at)
            VALUES ('019fe002-0008-7008-8008-000000000008', 'Respect', 'respect', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
