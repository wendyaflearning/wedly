<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Wave 1 — correctif : noms d'index Doctrine, type VARCHAR(255) pour enum, suppression des commentaires.
 */
final class Version20260402000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Wave 1 correctif — index names, culture.type VARCHAR(255), clear column comments';
    }

    public function up(Schema $schema): void
    {
        // Renommage des index vers la convention Doctrine (hash)
        $this->addSql('ALTER INDEX uniq_style_slug RENAME TO UNIQ_33BDB86A989D9B62');
        $this->addSql('ALTER INDEX uniq_culture_slug RENAME TO UNIQ_B6A99CEB989D9B62');
        $this->addSql('ALTER INDEX uniq_confession_slug RENAME TO UNIQ_E72F923A989D9B62');
        $this->addSql('ALTER INDEX uniq_service_slug RENAME TO UNIQ_E19D9AD2989D9B62');

        // culture.type : VARCHAR(9) → VARCHAR(255)
        $this->addSql('ALTER TABLE culture ALTER type TYPE VARCHAR(255)');

        // Suppression des commentaires (DBAL 4 ne les utilise plus)
        $this->addSql("COMMENT ON COLUMN style.id IS ''");
        $this->addSql("COMMENT ON COLUMN style.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN style.updated_at IS ''");
        $this->addSql("COMMENT ON COLUMN culture.id IS ''");
        $this->addSql("COMMENT ON COLUMN culture.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN culture.updated_at IS ''");
        $this->addSql("COMMENT ON COLUMN confession.id IS ''");
        $this->addSql("COMMENT ON COLUMN confession.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN confession.updated_at IS ''");
        $this->addSql("COMMENT ON COLUMN service.id IS ''");
        $this->addSql("COMMENT ON COLUMN service.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN service.updated_at IS ''");
        $this->addSql("COMMENT ON COLUMN plan.id IS ''");
        $this->addSql("COMMENT ON COLUMN plan.category_count IS ''");
        $this->addSql("COMMENT ON COLUMN plan.created_at IS ''");
        $this->addSql("COMMENT ON COLUMN plan.updated_at IS ''");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER INDEX UNIQ_33BDB86A989D9B62 RENAME TO uniq_style_slug');
        $this->addSql('ALTER INDEX UNIQ_B6A99CEB989D9B62 RENAME TO uniq_culture_slug');
        $this->addSql('ALTER INDEX UNIQ_E72F923A989D9B62 RENAME TO uniq_confession_slug');
        $this->addSql('ALTER INDEX UNIQ_E19D9AD2989D9B62 RENAME TO uniq_service_slug');
        $this->addSql('ALTER TABLE culture ALTER type TYPE VARCHAR(9)');
    }
}
