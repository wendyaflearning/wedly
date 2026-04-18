<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration — Add status column to app_user table
 */
final class Version20260414000007 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'AlterAppUserAddStatus';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE app_user ADD status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        $this->addSql("ALTER TABLE app_user ADD CONSTRAINT chk_user_status CHECK (status IN ('pending', 'under_review', 'active', 'suspended'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user DROP CONSTRAINT chk_user_status');
        $this->addSql('ALTER TABLE app_user DROP COLUMN status');
    }
}
