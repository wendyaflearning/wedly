<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802073031 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute vendor_auto_tagged_service : trace les services auto-associés au vendor via le tagging de portfolio (WED-94)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE vendor_auto_tagged_service (id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, vendor_id UUID NOT NULL, service_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_4A3FDECBF603EE73 ON vendor_auto_tagged_service (vendor_id)');
        $this->addSql('CREATE INDEX IDX_4A3FDECBED5CA9E6 ON vendor_auto_tagged_service (service_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_vendor_auto_tagged_service ON vendor_auto_tagged_service (vendor_id, service_id)');
        $this->addSql('ALTER TABLE vendor_auto_tagged_service ADD CONSTRAINT FK_4A3FDECBF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_auto_tagged_service ADD CONSTRAINT FK_4A3FDECBED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_auto_tagged_service DROP CONSTRAINT FK_4A3FDECBF603EE73');
        $this->addSql('ALTER TABLE vendor_auto_tagged_service DROP CONSTRAINT FK_4A3FDECBED5CA9E6');
        $this->addSql('DROP TABLE vendor_auto_tagged_service');
    }
}
