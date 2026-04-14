<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration C — Create vendor_venue_details, vendor_catering_details, vendor_animation_details
 */
final class Version20260414000005 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'CreateVendorDetailsTablesThree';
    }

    public function up(Schema $schema): void
    {
        // vendor_venue_details
        $this->addSql('CREATE TABLE vendor_venue_details (id UUID NOT NULL, vendor_id UUID NOT NULL, has_catering BOOLEAN NOT NULL, has_accommodation BOOLEAN NOT NULL, has_outdoor_space BOOLEAN NOT NULL, has_corkage_fee BOOLEAN NOT NULL, is_pmr_accessible BOOLEAN NOT NULL, has_toilets BOOLEAN NOT NULL, capacity_min INT DEFAULT NULL, capacity_max INT DEFAULT NULL, distance_to_city_minutes INT DEFAULT NULL, venue_type VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_venue_details_vendor ON vendor_venue_details (vendor_id)');
        $this->addSql('ALTER TABLE vendor_venue_details ADD CONSTRAINT FK_venue_details_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');

        // vendor_catering_details
        $this->addSql('CREATE TABLE vendor_catering_details (id UUID NOT NULL, vendor_id UUID NOT NULL, is_kosher BOOLEAN NOT NULL, is_halal BOOLEAN NOT NULL, is_vegan BOOLEAN NOT NULL, is_gluten_free BOOLEAN NOT NULL, offers_table_service BOOLEAN NOT NULL, offers_buffet BOOLEAN NOT NULL, offers_cocktail BOOLEAN NOT NULL, provides_tableware BOOLEAN NOT NULL, provides_furniture BOOLEAN NOT NULL, covers_min INT DEFAULT NULL, covers_max INT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_catering_details_vendor ON vendor_catering_details (vendor_id)');
        $this->addSql('ALTER TABLE vendor_catering_details ADD CONSTRAINT FK_catering_details_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');

        // vendor_animation_details
        $this->addSql('CREATE TABLE vendor_animation_details (id UUID NOT NULL, vendor_id UUID NOT NULL, description TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_animation_details_vendor ON vendor_animation_details (vendor_id)');
        $this->addSql('ALTER TABLE vendor_animation_details ADD CONSTRAINT FK_animation_details_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_animation_details DROP CONSTRAINT FK_animation_details_vendor');
        $this->addSql('DROP TABLE vendor_animation_details');

        $this->addSql('ALTER TABLE vendor_catering_details DROP CONSTRAINT FK_catering_details_vendor');
        $this->addSql('DROP TABLE vendor_catering_details');

        $this->addSql('ALTER TABLE vendor_venue_details DROP CONSTRAINT FK_venue_details_vendor');
        $this->addSql('DROP TABLE vendor_venue_details');
    }
}
