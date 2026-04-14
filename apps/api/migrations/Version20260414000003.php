<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration A — Create region table and vendor_zones join table
 */
final class Version20260414000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'CreateRegionAndVendorZones';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE region (id UUID NOT NULL, name VARCHAR(100) NOT NULL, slug VARCHAR(100) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_region_slug ON region (slug)');

        $this->addSql('CREATE TABLE vendor_zones (vendor_id UUID NOT NULL, region_id UUID NOT NULL, PRIMARY KEY(vendor_id, region_id))');
        $this->addSql('CREATE INDEX IDX_vendor_zones_vendor ON vendor_zones (vendor_id)');
        $this->addSql('CREATE INDEX IDX_vendor_zones_region ON vendor_zones (region_id)');
        $this->addSql('ALTER TABLE vendor_zones ADD CONSTRAINT FK_vendor_zones_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_zones ADD CONSTRAINT FK_vendor_zones_region FOREIGN KEY (region_id) REFERENCES region (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_zones DROP CONSTRAINT FK_vendor_zones_region');
        $this->addSql('ALTER TABLE vendor_zones DROP CONSTRAINT FK_vendor_zones_vendor');
        $this->addSql('DROP TABLE vendor_zones');
        $this->addSql('DROP TABLE region');
    }
}
