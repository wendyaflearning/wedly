<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration 1 — Create invite_tokens table
 */
final class Version20260414000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create invite_tokens table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE invite_tokens (id UUID NOT NULL, token VARCHAR(128) NOT NULL, persona VARCHAR(10) NOT NULL, status VARCHAR(10) NOT NULL, created_by_id UUID DEFAULT NULL, user_id UUID DEFAULT NULL, vendor_id UUID DEFAULT NULL, couple_id UUID DEFAULT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_invite_tokens_token ON invite_tokens (token)');
        $this->addSql('CREATE INDEX IDX_invite_tokens_created_by ON invite_tokens (created_by_id)');
        $this->addSql('CREATE INDEX IDX_invite_tokens_user ON invite_tokens (user_id)');
        $this->addSql('CREATE INDEX IDX_invite_tokens_vendor ON invite_tokens (vendor_id)');
        $this->addSql('CREATE INDEX IDX_invite_tokens_couple ON invite_tokens (couple_id)');
        $this->addSql('ALTER TABLE invite_tokens ADD CONSTRAINT FK_invite_tokens_created_by FOREIGN KEY (created_by_id) REFERENCES app_user (id) ON DELETE SET NULL NOT DEFERRABLE');
        $this->addSql('ALTER TABLE invite_tokens ADD CONSTRAINT FK_invite_tokens_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE SET NULL NOT DEFERRABLE');
        $this->addSql('ALTER TABLE invite_tokens ADD CONSTRAINT FK_invite_tokens_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id) ON DELETE SET NULL NOT DEFERRABLE');
        $this->addSql('ALTER TABLE invite_tokens ADD CONSTRAINT FK_invite_tokens_couple FOREIGN KEY (couple_id) REFERENCES couple (id) ON DELETE SET NULL NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE invite_tokens DROP CONSTRAINT FK_invite_tokens_couple');
        $this->addSql('ALTER TABLE invite_tokens DROP CONSTRAINT FK_invite_tokens_vendor');
        $this->addSql('ALTER TABLE invite_tokens DROP CONSTRAINT FK_invite_tokens_user');
        $this->addSql('ALTER TABLE invite_tokens DROP CONSTRAINT FK_invite_tokens_created_by');
        $this->addSql('DROP TABLE invite_tokens');
    }
}
