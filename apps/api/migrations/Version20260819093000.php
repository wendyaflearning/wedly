<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260819093000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add append-only wedding consent audit table'; }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE wedding_consent (id UUID NOT NULL, wedding_id UUID NOT NULL, consent_type VARCHAR(255) NOT NULL, granted BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_A38E679CFCBBB0ED ON wedding_consent (wedding_id)');
        $this->addSql('ALTER TABLE wedding_consent ADD CONSTRAINT FK_A38E679CFCBBB0ED FOREIGN KEY (wedding_id) REFERENCES wedding (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void { $this->addSql('DROP TABLE wedding_consent'); }
}
