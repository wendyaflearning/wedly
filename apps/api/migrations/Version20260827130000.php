<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute vendor_email_log : trace les envois d\'email prestataire et leur statut, base de l\'anti-double-envoi (US-000 / WED-140)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE vendor_email_log (id UUID NOT NULL, vendor_id UUID NOT NULL, type VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL, error_message TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_vendor_email_log_lookup ON vendor_email_log (vendor_id, type, status)');
        $this->addSql('ALTER TABLE vendor_email_log ADD CONSTRAINT FK_vendor_email_log_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_email_log DROP CONSTRAINT FK_vendor_email_log_vendor');
        $this->addSql('DROP TABLE vendor_email_log');
    }
}
