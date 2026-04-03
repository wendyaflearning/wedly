<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Wave 2 — Core entities: app_user, wedding, vendor, couple, offer, subscription
 */
final class Version20260402000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Wave 2 — Core entities: app_user, wedding, vendor, couple, offer, subscription';
    }

    public function up(Schema $schema): void
    {
        // 1. app_user (aucune FK)
        $this->addSql('CREATE TABLE app_user (id UUID NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, invite_token VARCHAR(64) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_88BDF3E9E7927C74 ON app_user (email)');

        // 2. wedding (aucune FK)
        $this->addSql('CREATE TABLE wedding (id UUID NOT NULL, date DATE NOT NULL, budget_cents INT NOT NULL, location VARCHAR(255) NOT NULL, zone VARCHAR(255) NOT NULL, guest_count INT NOT NULL, ambiance VARCHAR(255) NOT NULL, ceremony_type VARCHAR(255) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');

        // 3. vendor (FK → app_user)
        $this->addSql('CREATE TABLE vendor (id UUID NOT NULL, brand_name VARCHAR(255) NOT NULL, description TEXT NOT NULL, siret VARCHAR(14) NOT NULL, address VARCHAR(255) NOT NULL, zipcode VARCHAR(10) NOT NULL, city VARCHAR(100) NOT NULL, zone VARCHAR(255) NOT NULL, price_min_cents INT NOT NULL, price_max_cents INT NOT NULL, is_validated BOOLEAN NOT NULL, is_active BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_F52233F6A76ED395 ON vendor (user_id)');
        $this->addSql('ALTER TABLE vendor ADD CONSTRAINT FK_F52233F6A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) NOT DEFERRABLE');

        // 4. couple (FK → app_user, FK → wedding)
        $this->addSql('CREATE TABLE couple (id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, user_id UUID NOT NULL, wedding_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D840B549A76ED395 ON couple (user_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D840B549FCBBB0ED ON couple (wedding_id)');
        $this->addSql('ALTER TABLE couple ADD CONSTRAINT FK_D840B549A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE couple ADD CONSTRAINT FK_D840B549FCBBB0ED FOREIGN KEY (wedding_id) REFERENCES wedding (id) NOT DEFERRABLE');

        // 5. offer (FK → vendor)
        $this->addSql('CREATE TABLE offer (id UUID NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, price_cents INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, vendor_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_29D6873EF603EE73 ON offer (vendor_id)');
        $this->addSql('ALTER TABLE offer ADD CONSTRAINT FK_29D6873EF603EE73 FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE');

        // 6. subscription (FK → couple, FK → plan)
        $this->addSql('CREATE TABLE subscription (id UUID NOT NULL, stripe_id VARCHAR(255) DEFAULT NULL, status VARCHAR(255) NOT NULL, amount_paid_cents INT NOT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, couple_id UUID NOT NULL, plan_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_A3C664D3F66468CA ON subscription (couple_id)');
        $this->addSql('CREATE INDEX IDX_A3C664D3E899029B ON subscription (plan_id)');
        $this->addSql('ALTER TABLE subscription ADD CONSTRAINT FK_A3C664D3F66468CA FOREIGN KEY (couple_id) REFERENCES couple (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE subscription ADD CONSTRAINT FK_A3C664D3E899029B FOREIGN KEY (plan_id) REFERENCES plan (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE subscription DROP CONSTRAINT FK_A3C664D3F66468CA');
        $this->addSql('ALTER TABLE subscription DROP CONSTRAINT FK_A3C664D3E899029B');
        $this->addSql('ALTER TABLE offer DROP CONSTRAINT FK_29D6873EF603EE73');
        $this->addSql('ALTER TABLE couple DROP CONSTRAINT FK_D840B549A76ED395');
        $this->addSql('ALTER TABLE couple DROP CONSTRAINT FK_D840B549FCBBB0ED');
        $this->addSql('ALTER TABLE vendor DROP CONSTRAINT FK_F52233F6A76ED395');
        $this->addSql('DROP TABLE subscription');
        $this->addSql('DROP TABLE offer');
        $this->addSql('DROP TABLE couple');
        $this->addSql('DROP TABLE vendor');
        $this->addSql('DROP TABLE wedding');
        $this->addSql('DROP TABLE app_user');
    }
}
