<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260803142800 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Refonte du tagging portfolio : TagType / TagValue / portfolio_image_tag, suppression de portfolio_image_specialty / portfolio_image_style (WED-97)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE portfolio_image_tag (portfolio_image_id UUID NOT NULL, tag_value_id UUID NOT NULL, PRIMARY KEY (portfolio_image_id, tag_value_id))');
        $this->addSql('CREATE INDEX IDX_A5CBF6FC412F7FF5 ON portfolio_image_tag (portfolio_image_id)');
        $this->addSql('CREATE INDEX IDX_A5CBF6FCCF11C079 ON portfolio_image_tag (tag_value_id)');
        $this->addSql('CREATE TABLE tag_type (id UUID NOT NULL, label VARCHAR(100) NOT NULL, is_primary BOOLEAN DEFAULT false NOT NULL, max_selections INT DEFAULT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, service_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_62D1E89FED5CA9E6 ON tag_type (service_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_TAG_TYPE_SERVICE_PRIMARY ON tag_type (service_id) WHERE (is_primary = true)');
        $this->addSql('CREATE TABLE tag_value (id UUID NOT NULL, label VARCHAR(100) NOT NULL, is_active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, tag_type_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_3F9B4132F77DA139 ON tag_value (tag_type_id)');
        $this->addSql('ALTER TABLE portfolio_image_tag ADD CONSTRAINT FK_A5CBF6FC412F7FF5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE portfolio_image_tag ADD CONSTRAINT FK_A5CBF6FCCF11C079 FOREIGN KEY (tag_value_id) REFERENCES tag_value (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE tag_type ADD CONSTRAINT FK_62D1E89FED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE tag_value ADD CONSTRAINT FK_3F9B4132F77DA139 FOREIGN KEY (tag_type_id) REFERENCES tag_type (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE portfolio_image_specialty DROP CONSTRAINT fk_9369d9659a353316');
        $this->addSql('ALTER TABLE portfolio_image_specialty DROP CONSTRAINT fk_9369d965412f7ff5');
        $this->addSql('ALTER TABLE portfolio_image_style DROP CONSTRAINT fk_9ac10a17bacd6074');
        $this->addSql('ALTER TABLE portfolio_image_style DROP CONSTRAINT fk_9ac10a17412f7ff5');
        $this->addSql('DROP TABLE portfolio_image_specialty');
        $this->addSql('DROP TABLE portfolio_image_style');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE portfolio_image_specialty (portfolio_image_id UUID NOT NULL, specialty_id UUID NOT NULL, PRIMARY KEY (portfolio_image_id, specialty_id))');
        $this->addSql('CREATE INDEX idx_9369d9659a353316 ON portfolio_image_specialty (specialty_id)');
        $this->addSql('CREATE INDEX idx_9369d965412f7ff5 ON portfolio_image_specialty (portfolio_image_id)');
        $this->addSql('CREATE TABLE portfolio_image_style (portfolio_image_id UUID NOT NULL, style_id UUID NOT NULL, PRIMARY KEY (portfolio_image_id, style_id))');
        $this->addSql('CREATE INDEX idx_9ac10a17bacd6074 ON portfolio_image_style (style_id)');
        $this->addSql('CREATE INDEX idx_9ac10a17412f7ff5 ON portfolio_image_style (portfolio_image_id)');
        $this->addSql('ALTER TABLE portfolio_image_specialty ADD CONSTRAINT fk_9369d9659a353316 FOREIGN KEY (specialty_id) REFERENCES specialty (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE portfolio_image_specialty ADD CONSTRAINT fk_9369d965412f7ff5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE portfolio_image_style ADD CONSTRAINT fk_9ac10a17bacd6074 FOREIGN KEY (style_id) REFERENCES style (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE portfolio_image_style ADD CONSTRAINT fk_9ac10a17412f7ff5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE portfolio_image_tag DROP CONSTRAINT FK_A5CBF6FC412F7FF5');
        $this->addSql('ALTER TABLE portfolio_image_tag DROP CONSTRAINT FK_A5CBF6FCCF11C079');
        $this->addSql('ALTER TABLE tag_type DROP CONSTRAINT FK_62D1E89FED5CA9E6');
        $this->addSql('ALTER TABLE tag_value DROP CONSTRAINT FK_3F9B4132F77DA139');
        $this->addSql('DROP INDEX UNIQ_TAG_TYPE_SERVICE_PRIMARY');
        $this->addSql('DROP TABLE portfolio_image_tag');
        $this->addSql('DROP TABLE tag_type');
        $this->addSql('DROP TABLE tag_value');
    }
}
