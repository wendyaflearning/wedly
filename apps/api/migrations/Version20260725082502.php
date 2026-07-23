<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260725082502 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[WED-74 US1] Add specialty table + portfolio_image_specialty join table';
    }

    public function up(Schema $schema): void
    {
        // specialty
        $this->addSql(<<<'SQL'
            CREATE TABLE specialty (
              id UUID NOT NULL,
              name VARCHAR(100) NOT NULL,
              slug VARCHAR(100) NOT NULL,
              description TEXT DEFAULT NULL,
              sort_order INT NOT NULL,
              is_active BOOLEAN DEFAULT true NOT NULL,
              created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
              updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
              service_id UUID NOT NULL,
              PRIMARY KEY (id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_E066A6ECED5CA9E6 ON specialty (service_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_specialty_service_slug ON specialty (service_id, slug)');
        $this->addSql('ALTER TABLE specialty ADD CONSTRAINT FK_E066A6ECED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE');

        // portfolio_image_specialty
        $this->addSql(<<<'SQL'
            CREATE TABLE portfolio_image_specialty (
              portfolio_image_id UUID NOT NULL,
              specialty_id UUID NOT NULL,
              PRIMARY KEY (portfolio_image_id, specialty_id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_9369D965412F7FF5 ON portfolio_image_specialty (portfolio_image_id)');
        $this->addSql('CREATE INDEX IDX_9369D9659A353316 ON portfolio_image_specialty (specialty_id)');
        $this->addSql('ALTER TABLE portfolio_image_specialty ADD CONSTRAINT FK_9369D965412F7FF5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE portfolio_image_specialty ADD CONSTRAINT FK_9369D9659A353316 FOREIGN KEY (specialty_id) REFERENCES specialty (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image_specialty DROP CONSTRAINT FK_9369D965412F7FF5');
        $this->addSql('ALTER TABLE portfolio_image_specialty DROP CONSTRAINT FK_9369D9659A353316');
        $this->addSql('ALTER TABLE specialty DROP CONSTRAINT FK_E066A6ECED5CA9E6');
        $this->addSql('DROP TABLE portfolio_image_specialty');
        $this->addSql('DROP TABLE specialty');
    }
}
