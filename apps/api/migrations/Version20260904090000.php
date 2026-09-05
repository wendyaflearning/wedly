<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260904090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add nullable phone to couple for the onboarding capture (WED-216)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE couple ADD phone VARCHAR(20) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE couple DROP phone');
    }
}
