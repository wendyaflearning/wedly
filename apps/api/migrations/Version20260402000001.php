<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Wave 1 — Reference tables (no FK dependencies)
 * Creates: style, culture, confession, service, plan
 */
final class Version20260402000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Wave 1 — Reference tables: style, culture, confession, service, plan';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE style (
                id         UUID        NOT NULL,
                name       VARCHAR(100) NOT NULL,
                slug       VARCHAR(100) NOT NULL,
                description TEXT        DEFAULT NULL,
                cover_image_url VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX uniq_style_slug ON style (slug)');
        $this->addSql("COMMENT ON COLUMN style.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN style.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN style.updated_at IS '(DC2Type:datetime_immutable)'");

        $this->addSql(<<<'SQL'
            CREATE TABLE culture (
                id         UUID         NOT NULL,
                name       VARCHAR(100) NOT NULL,
                slug       VARCHAR(100) NOT NULL,
                type       VARCHAR(9)   NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX uniq_culture_slug ON culture (slug)');
        $this->addSql("COMMENT ON COLUMN culture.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN culture.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN culture.updated_at IS '(DC2Type:datetime_immutable)'");

        $this->addSql(<<<'SQL'
            CREATE TABLE confession (
                id         UUID         NOT NULL,
                name       VARCHAR(100) NOT NULL,
                slug       VARCHAR(100) NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX uniq_confession_slug ON confession (slug)');
        $this->addSql("COMMENT ON COLUMN confession.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN confession.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN confession.updated_at IS '(DC2Type:datetime_immutable)'");

        $this->addSql(<<<'SQL'
            CREATE TABLE service (
                id         UUID         NOT NULL,
                name       VARCHAR(100) NOT NULL,
                slug       VARCHAR(100) NOT NULL,
                sort_order INTEGER      NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX uniq_service_slug ON service (slug)');
        $this->addSql("COMMENT ON COLUMN service.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN service.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN service.updated_at IS '(DC2Type:datetime_immutable)'");

        $this->addSql(<<<'SQL'
            CREATE TABLE plan (
                id             UUID        NOT NULL,
                name           VARCHAR(50) NOT NULL,
                price_cents    INTEGER     NOT NULL,
                category_count INTEGER     NOT NULL,
                is_active      BOOLEAN     NOT NULL,
                created_at     TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at     TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);
        $this->addSql("COMMENT ON COLUMN plan.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN plan.category_count IS '-1 = illimité (plan premium)'");
        $this->addSql("COMMENT ON COLUMN plan.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN plan.updated_at IS '(DC2Type:datetime_immutable)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE style');
        $this->addSql('DROP TABLE culture');
        $this->addSql('DROP TABLE confession');
        $this->addSql('DROP TABLE service');
        $this->addSql('DROP TABLE plan');
    }
}
