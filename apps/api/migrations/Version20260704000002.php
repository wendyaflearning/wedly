<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260704000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[DDL] Enforce CultureType enum values at DB level via CHECK constraint';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE culture ADD CONSTRAINT chk_culture_type CHECK (type IN ('continent', 'country', 'autre'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE culture DROP CONSTRAINT chk_culture_type');
    }
}
