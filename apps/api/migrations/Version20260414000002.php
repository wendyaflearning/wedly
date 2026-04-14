<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration 2 — Remove invite_token column from app_user
 */
final class Version20260414000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove invite_token column from app_user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user DROP COLUMN invite_token');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user ADD invite_token VARCHAR(64) DEFAULT NULL');
    }
}
