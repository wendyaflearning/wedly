<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260421000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Replace is_validated/is_active on vendor with status; add status to couple';
    }

    public function up(Schema $schema): void
    {
        // vendor: add status column with default, then drop old booleans
        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                DROP COLUMN is_validated,
                DROP COLUMN is_active
        SQL);

        // couple: add status column with default
        $this->addSql(<<<'SQL'
            ALTER TABLE couple
                ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
        SQL);
    }

    public function down(Schema $schema): void
    {
        // couple: remove status column
        $this->addSql(<<<'SQL'
            ALTER TABLE couple
                DROP COLUMN status
        SQL);

        // vendor: restore old booleans, then drop status
        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                ADD COLUMN is_validated BOOLEAN NOT NULL DEFAULT FALSE,
                ADD COLUMN is_active    BOOLEAN NOT NULL DEFAULT TRUE
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                DROP COLUMN status
        SQL);
    }
}
