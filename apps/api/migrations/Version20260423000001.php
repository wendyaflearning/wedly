<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260423000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add onboarding_step column to vendor table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE vendor ADD onboarding_step VARCHAR(50) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
