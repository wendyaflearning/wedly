<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Wave 3 — Join tables + portfolio_image + booking_blocker
 */
final class Version20260402000006 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Wave 3 — Join tables (vendor/wedding/portfolio × style/culture/confession/service) + portfolio_image + booking_blocker';
    }

    public function up(Schema $schema): void
    {
        // portfolio_image (doit exister avant portfolio_image_style)
        $this->addSql('CREATE TABLE portfolio_image (id UUID NOT NULL, url VARCHAR(255) NOT NULL, sort_seq INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, vendor_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_98652E1AF603EE73 ON portfolio_image (vendor_id)');
        $this->addSql('ALTER TABLE portfolio_image ADD CONSTRAINT FK_98652E1AF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');

        // booking_blocker
        $this->addSql('CREATE TABLE booking_blocker (id UUID NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, reason VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, vendor_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_743F1BF1F603EE73 ON booking_blocker (vendor_id)');
        $this->addSql('ALTER TABLE booking_blocker ADD CONSTRAINT FK_743F1BF1F603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');

        // vendor_service
        $this->addSql('CREATE TABLE vendor_service (vendor_id UUID NOT NULL, service_id UUID NOT NULL, PRIMARY KEY (vendor_id, service_id))');
        $this->addSql('CREATE INDEX IDX_FFEAA2BDF603EE73 ON vendor_service (vendor_id)');
        $this->addSql('CREATE INDEX IDX_FFEAA2BDED5CA9E6 ON vendor_service (service_id)');
        $this->addSql('ALTER TABLE vendor_service ADD CONSTRAINT FK_FFEAA2BDF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_service ADD CONSTRAINT FK_FFEAA2BDED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE');

        // vendor_style
        $this->addSql('CREATE TABLE vendor_style (vendor_id UUID NOT NULL, style_id UUID NOT NULL, PRIMARY KEY (vendor_id, style_id))');
        $this->addSql('CREATE INDEX IDX_25FBBA2AF603EE73 ON vendor_style (vendor_id)');
        $this->addSql('CREATE INDEX IDX_25FBBA2ABACD6074 ON vendor_style (style_id)');
        $this->addSql('ALTER TABLE vendor_style ADD CONSTRAINT FK_25FBBA2AF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_style ADD CONSTRAINT FK_25FBBA2ABACD6074 FOREIGN KEY (style_id) REFERENCES style (id) NOT DEFERRABLE');

        // vendor_culture
        $this->addSql('CREATE TABLE vendor_culture (vendor_id UUID NOT NULL, culture_id UUID NOT NULL, PRIMARY KEY (vendor_id, culture_id))');
        $this->addSql('CREATE INDEX IDX_A8DEA484F603EE73 ON vendor_culture (vendor_id)');
        $this->addSql('CREATE INDEX IDX_A8DEA484B108249D ON vendor_culture (culture_id)');
        $this->addSql('ALTER TABLE vendor_culture ADD CONSTRAINT FK_A8DEA484F603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_culture ADD CONSTRAINT FK_A8DEA484B108249D FOREIGN KEY (culture_id) REFERENCES culture (id) NOT DEFERRABLE');

        // vendor_confession
        $this->addSql('CREATE TABLE vendor_confession (vendor_id UUID NOT NULL, confession_id UUID NOT NULL, PRIMARY KEY (vendor_id, confession_id))');
        $this->addSql('CREATE INDEX IDX_7D5A465DF603EE73 ON vendor_confession (vendor_id)');
        $this->addSql('CREATE INDEX IDX_7D5A465DA71B7050 ON vendor_confession (confession_id)');
        $this->addSql('ALTER TABLE vendor_confession ADD CONSTRAINT FK_7D5A465DF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE vendor_confession ADD CONSTRAINT FK_7D5A465DA71B7050 FOREIGN KEY (confession_id) REFERENCES confession (id) NOT DEFERRABLE');

        // portfolio_image_style
        $this->addSql('CREATE TABLE portfolio_image_style (portfolio_image_id UUID NOT NULL, style_id UUID NOT NULL, PRIMARY KEY (portfolio_image_id, style_id))');
        $this->addSql('CREATE INDEX IDX_9AC10A17412F7FF5 ON portfolio_image_style (portfolio_image_id)');
        $this->addSql('CREATE INDEX IDX_9AC10A17BACD6074 ON portfolio_image_style (style_id)');
        $this->addSql('ALTER TABLE portfolio_image_style ADD CONSTRAINT FK_9AC10A17412F7FF5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE portfolio_image_style ADD CONSTRAINT FK_9AC10A17BACD6074 FOREIGN KEY (style_id) REFERENCES style (id) NOT DEFERRABLE');

        // wedding_style
        $this->addSql('CREATE TABLE wedding_style (wedding_id UUID NOT NULL, style_id UUID NOT NULL, PRIMARY KEY (wedding_id, style_id))');
        $this->addSql('CREATE INDEX IDX_33F464BEFCBBB0ED ON wedding_style (wedding_id)');
        $this->addSql('CREATE INDEX IDX_33F464BEBACD6074 ON wedding_style (style_id)');
        $this->addSql('ALTER TABLE wedding_style ADD CONSTRAINT FK_33F464BEFCBBB0ED FOREIGN KEY (wedding_id) REFERENCES wedding (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE wedding_style ADD CONSTRAINT FK_33F464BEBACD6074 FOREIGN KEY (style_id) REFERENCES style (id) NOT DEFERRABLE');

        // wedding_culture
        $this->addSql('CREATE TABLE wedding_culture (wedding_id UUID NOT NULL, culture_id UUID NOT NULL, PRIMARY KEY (wedding_id, culture_id))');
        $this->addSql('CREATE INDEX IDX_DC980246FCBBB0ED ON wedding_culture (wedding_id)');
        $this->addSql('CREATE INDEX IDX_DC980246B108249D ON wedding_culture (culture_id)');
        $this->addSql('ALTER TABLE wedding_culture ADD CONSTRAINT FK_DC980246FCBBB0ED FOREIGN KEY (wedding_id) REFERENCES wedding (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE wedding_culture ADD CONSTRAINT FK_DC980246B108249D FOREIGN KEY (culture_id) REFERENCES culture (id) NOT DEFERRABLE');

        // wedding_confession
        $this->addSql('CREATE TABLE wedding_confession (wedding_id UUID NOT NULL, confession_id UUID NOT NULL, PRIMARY KEY (wedding_id, confession_id))');
        $this->addSql('CREATE INDEX IDX_8893FBCDFCBBB0ED ON wedding_confession (wedding_id)');
        $this->addSql('CREATE INDEX IDX_8893FBCDA71B7050 ON wedding_confession (confession_id)');
        $this->addSql('ALTER TABLE wedding_confession ADD CONSTRAINT FK_8893FBCDFCBBB0ED FOREIGN KEY (wedding_id) REFERENCES wedding (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE wedding_confession ADD CONSTRAINT FK_8893FBCDA71B7050 FOREIGN KEY (confession_id) REFERENCES confession (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image_style DROP CONSTRAINT FK_9AC10A17412F7FF5');
        $this->addSql('ALTER TABLE portfolio_image_style DROP CONSTRAINT FK_9AC10A17BACD6074');
        $this->addSql('ALTER TABLE wedding_style DROP CONSTRAINT FK_33F464BEFCBBB0ED');
        $this->addSql('ALTER TABLE wedding_style DROP CONSTRAINT FK_33F464BEBACD6074');
        $this->addSql('ALTER TABLE wedding_culture DROP CONSTRAINT FK_DC980246FCBBB0ED');
        $this->addSql('ALTER TABLE wedding_culture DROP CONSTRAINT FK_DC980246B108249D');
        $this->addSql('ALTER TABLE wedding_confession DROP CONSTRAINT FK_8893FBCDFCBBB0ED');
        $this->addSql('ALTER TABLE wedding_confession DROP CONSTRAINT FK_8893FBCDA71B7050');
        $this->addSql('ALTER TABLE vendor_service DROP CONSTRAINT FK_FFEAA2BDF603EE73');
        $this->addSql('ALTER TABLE vendor_service DROP CONSTRAINT FK_FFEAA2BDED5CA9E6');
        $this->addSql('ALTER TABLE vendor_style DROP CONSTRAINT FK_25FBBA2AF603EE73');
        $this->addSql('ALTER TABLE vendor_style DROP CONSTRAINT FK_25FBBA2ABACD6074');
        $this->addSql('ALTER TABLE vendor_culture DROP CONSTRAINT FK_A8DEA484F603EE73');
        $this->addSql('ALTER TABLE vendor_culture DROP CONSTRAINT FK_A8DEA484B108249D');
        $this->addSql('ALTER TABLE vendor_confession DROP CONSTRAINT FK_7D5A465DF603EE73');
        $this->addSql('ALTER TABLE vendor_confession DROP CONSTRAINT FK_7D5A465DA71B7050');
        $this->addSql('ALTER TABLE booking_blocker DROP CONSTRAINT FK_743F1BF1F603EE73');
        $this->addSql('ALTER TABLE portfolio_image DROP CONSTRAINT FK_98652E1AF603EE73');
        $this->addSql('DROP TABLE portfolio_image_style');
        $this->addSql('DROP TABLE wedding_style');
        $this->addSql('DROP TABLE wedding_culture');
        $this->addSql('DROP TABLE wedding_confession');
        $this->addSql('DROP TABLE vendor_service');
        $this->addSql('DROP TABLE vendor_style');
        $this->addSql('DROP TABLE vendor_culture');
        $this->addSql('DROP TABLE vendor_confession');
        $this->addSql('DROP TABLE booking_blocker');
        $this->addSql('DROP TABLE portfolio_image');
    }
}
