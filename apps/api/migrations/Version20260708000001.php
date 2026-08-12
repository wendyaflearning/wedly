<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260708000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[DDL] Add persistent admin notifications for vendor review submissions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE admin_notification (id UUID NOT NULL, recipient_id UUID NOT NULL, provider_id UUID NOT NULL, type VARCHAR(80) NOT NULL, payload JSON NOT NULL, read_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_admin_notification_recipient_created_at ON admin_notification (recipient_id, created_at)');
        $this->addSql('CREATE INDEX idx_admin_notification_recipient_read_at ON admin_notification (recipient_id, read_at)');
        $this->addSql('CREATE INDEX IDX_C615D427E92F8F78 ON admin_notification (recipient_id)');
        $this->addSql('CREATE INDEX IDX_C615D427A53A8AA ON admin_notification (provider_id)');
        $this->addSql('ALTER TABLE admin_notification ADD CONSTRAINT FK_C615D427E92F8F78 FOREIGN KEY (recipient_id) REFERENCES app_user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE admin_notification ADD CONSTRAINT FK_C615D427A53A8AA FOREIGN KEY (provider_id) REFERENCES vendor (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE admin_notification ADD CONSTRAINT chk_admin_notification_type CHECK (type IN ('provider_pending_review'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE admin_notification DROP CONSTRAINT FK_C615D427E92F8F78');
        $this->addSql('ALTER TABLE admin_notification DROP CONSTRAINT FK_C615D427A53A8AA');
        $this->addSql('DROP TABLE admin_notification');
    }
}
