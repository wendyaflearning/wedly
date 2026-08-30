<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260819110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add provider_lead for qualified contact requests from couples to vendors (WED-108)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE provider_lead (id UUID NOT NULL, couple_id UUID NOT NULL, vendor_id UUID NOT NULL, budget_cents INT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', unlocked BOOLEAN NOT NULL DEFAULT TRUE, origin VARCHAR(20) NOT NULL DEFAULT 'wedream', created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX IDX_CD1902B7F66468CA ON provider_lead (couple_id)');
        $this->addSql('CREATE INDEX IDX_CD1902B7F603EE73 ON provider_lead (vendor_id)');
        $this->addSql('ALTER TABLE provider_lead ADD CONSTRAINT FK_CD1902B7F66468CA FOREIGN KEY (couple_id) REFERENCES couple (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE provider_lead ADD CONSTRAINT FK_CD1902B7F603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE provider_lead DROP CONSTRAINT FK_CD1902B7F66468CA');
        $this->addSql('ALTER TABLE provider_lead DROP CONSTRAINT FK_CD1902B7F603EE73');
        $this->addSql('DROP TABLE provider_lead');
    }
}
