<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create password_reset_tokens table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE password_reset_tokens (
                id         UUID         NOT NULL,
                user_id    UUID         NOT NULL,
                token      VARCHAR(64)  NOT NULL,
                status     VARCHAR(10)  NOT NULL,
                expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.expires_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN password_reset_tokens.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE UNIQUE INDEX UNIQ_password_reset_tokens_token ON password_reset_tokens (token)');
        $this->addSql('CREATE INDEX IDX_password_reset_tokens_user_id ON password_reset_tokens (user_id)');
        $this->addSql('ALTER TABLE password_reset_tokens ADD CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE password_reset_tokens DROP CONSTRAINT FK_password_reset_tokens_user');
        $this->addSql('DROP TABLE password_reset_tokens');
    }
}
