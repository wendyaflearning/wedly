<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align password_reset_tokens schema with Doctrine conventions (index names, column types, comments)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_tokens ALTER status TYPE VARCHAR(255)');
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.id IS ''");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.user_id IS ''");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.expires_at IS ''");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.updated_at IS ''");
        $this->addSql('ALTER INDEX uniq_password_reset_tokens_token RENAME TO UNIQ_3967A2165F37A13B');
        $this->addSql('ALTER INDEX idx_password_reset_tokens_user_id RENAME TO IDX_3967A216A76ED395');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_tokens ALTER status TYPE VARCHAR(10)');
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.expires_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('ALTER INDEX UNIQ_3967A2165F37A13B RENAME TO uniq_password_reset_tokens_token');
        $this->addSql('ALTER INDEX IDX_3967A216A76ED395 RENAME TO idx_password_reset_tokens_user_id');
    }
}
