<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260414164343 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE app_user ALTER last_name DROP NOT NULL');
        $this->addSql('ALTER TABLE invite_tokens ALTER persona TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE invite_tokens ALTER status TYPE VARCHAR(255)');
        $this->addSql('ALTER INDEX uniq_invite_tokens_token RENAME TO UNIQ_87558B5D5F37A13B');
        $this->addSql('ALTER INDEX idx_invite_tokens_created_by RENAME TO IDX_87558B5DB03A8386');
        $this->addSql('ALTER INDEX idx_invite_tokens_user RENAME TO IDX_87558B5DA76ED395');
        $this->addSql('ALTER INDEX idx_invite_tokens_vendor RENAME TO IDX_87558B5DF603EE73');
        $this->addSql('ALTER INDEX idx_invite_tokens_couple RENAME TO IDX_87558B5DF66468CA');
        $this->addSql('ALTER INDEX uniq_region_slug RENAME TO UNIQ_F62F176989D9B62');
        $this->addSql('ALTER INDEX idx_service_parent RENAME TO IDX_E19D9AD2727ACA70');
        $this->addSql('ALTER TABLE vendor ALTER price_type TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE vendor ALTER price_type DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_vendor_zones_vendor RENAME TO IDX_938CB328F603EE73');
        $this->addSql('ALTER INDEX idx_vendor_zones_region RENAME TO IDX_938CB32898260155');
        $this->addSql('ALTER INDEX uniq_animation_details_vendor RENAME TO UNIQ_7C4D8B7F603EE73');
        $this->addSql('ALTER INDEX uniq_catering_details_vendor RENAME TO UNIQ_5581682DF603EE73');
        $this->addSql('ALTER TABLE vendor_venue_details ALTER venue_type TYPE VARCHAR(255)');
        $this->addSql('ALTER INDEX uniq_venue_details_vendor RENAME TO UNIQ_4A4DA4C3F603EE73');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE app_user ALTER last_name SET NOT NULL');
        $this->addSql('ALTER TABLE invite_tokens ALTER persona TYPE VARCHAR(10)');
        $this->addSql('ALTER TABLE invite_tokens ALTER status TYPE VARCHAR(10)');
        $this->addSql('ALTER INDEX uniq_87558b5d5f37a13b RENAME TO uniq_invite_tokens_token');
        $this->addSql('ALTER INDEX idx_87558b5db03a8386 RENAME TO idx_invite_tokens_created_by');
        $this->addSql('ALTER INDEX idx_87558b5da76ed395 RENAME TO idx_invite_tokens_user');
        $this->addSql('ALTER INDEX idx_87558b5df603ee73 RENAME TO idx_invite_tokens_vendor');
        $this->addSql('ALTER INDEX idx_87558b5df66468ca RENAME TO idx_invite_tokens_couple');
        $this->addSql('ALTER INDEX uniq_f62f176989d9b62 RENAME TO uniq_region_slug');
        $this->addSql('ALTER INDEX idx_e19d9ad2727aca70 RENAME TO idx_service_parent');
        $this->addSql('ALTER TABLE vendor ALTER price_type TYPE VARCHAR(20)');
        $this->addSql('ALTER TABLE vendor ALTER price_type SET DEFAULT \'per_service\'');
        $this->addSql('ALTER INDEX uniq_7c4d8b7f603ee73 RENAME TO uniq_animation_details_vendor');
        $this->addSql('ALTER INDEX uniq_5581682df603ee73 RENAME TO uniq_catering_details_vendor');
        $this->addSql('ALTER TABLE vendor_venue_details ALTER venue_type TYPE VARCHAR(20)');
        $this->addSql('ALTER INDEX uniq_4a4da4c3f603ee73 RENAME TO uniq_venue_details_vendor');
        $this->addSql('ALTER INDEX idx_938cb328f603ee73 RENAME TO idx_vendor_zones_vendor');
        $this->addSql('ALTER INDEX idx_938cb32898260155 RENAME TO idx_vendor_zones_region');
    }
}
