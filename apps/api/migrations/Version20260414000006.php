<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration D — Add parent_id self-reference to service table
 */
final class Version20260414000006 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'AlterServiceAddParentId';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE service ADD parent_id UUID DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_service_parent ON service (parent_id)');
        $this->addSql('ALTER TABLE service ADD CONSTRAINT FK_service_parent FOREIGN KEY (parent_id) REFERENCES service (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE service DROP CONSTRAINT FK_service_parent');
        $this->addSql('DROP INDEX IDX_service_parent');
        $this->addSql('ALTER TABLE service DROP COLUMN parent_id');
    }
}
