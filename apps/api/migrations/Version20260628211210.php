<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260628211210 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[RGPD] US-C001 — Create vendor_consent table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE vendor_consent (id UUID NOT NULL, consent_type VARCHAR(255) NOT NULL, granted BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, vendor_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_7D65307FF603EE73 ON vendor_consent (vendor_id)');
        $this->addSql('ALTER TABLE vendor_consent ADD CONSTRAINT FK_7D65307FF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_consent DROP CONSTRAINT FK_7D65307FF603EE73');
        $this->addSql('DROP TABLE vendor_consent');
    }
}
