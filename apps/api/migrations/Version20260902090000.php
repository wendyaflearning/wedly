<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260902090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add is_active to couple_pin for the reversible pin (WED-183)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE couple_pin ADD is_active BOOLEAN DEFAULT true NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE couple_pin DROP is_active');
    }
}
