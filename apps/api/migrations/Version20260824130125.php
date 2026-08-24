<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260824130125 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add vendor.wedream_enabled: explicit vendor opt-in for the public Wedream gallery (WED-73)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor ADD wedream_enabled BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP wedream_enabled');
    }
}
