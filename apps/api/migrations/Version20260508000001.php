<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260508000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'vendor: add legal information columns (legal_name, legal_form, incorporated_at, legal_status, siret_verified)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor ADD legal_name VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE vendor ADD legal_form VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE vendor ADD incorporated_at DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE vendor ADD legal_status VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE vendor ADD siret_verified BOOLEAN NOT NULL DEFAULT FALSE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP COLUMN siret_verified');
        $this->addSql('ALTER TABLE vendor DROP COLUMN legal_status');
        $this->addSql('ALTER TABLE vendor DROP COLUMN incorporated_at');
        $this->addSql('ALTER TABLE vendor DROP COLUMN legal_form');
        $this->addSql('ALTER TABLE vendor DROP COLUMN legal_name');
    }
}
