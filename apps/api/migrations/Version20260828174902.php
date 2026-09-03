<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828174902 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add couple_pin for pinned Wedream photos (WED-132)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE couple_pin (id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, couple_id UUID NOT NULL, portfolio_image_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_A5160AA6F66468CA ON couple_pin (couple_id)');
        $this->addSql('CREATE INDEX IDX_A5160AA6412F7FF5 ON couple_pin (portfolio_image_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_couple_pin_couple_image ON couple_pin (couple_id, portfolio_image_id)');
        $this->addSql('ALTER TABLE couple_pin ADD CONSTRAINT FK_A5160AA6F66468CA FOREIGN KEY (couple_id) REFERENCES couple (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE couple_pin ADD CONSTRAINT FK_A5160AA6412F7FF5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE couple_pin DROP CONSTRAINT FK_A5160AA6F66468CA');
        $this->addSql('ALTER TABLE couple_pin DROP CONSTRAINT FK_A5160AA6412F7FF5');
        $this->addSql('DROP TABLE couple_pin');
    }
}
