<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration B — Remove zone column from vendor, add price_type
 */
final class Version20260414000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'AlterVendorRemoveZoneAddPriceType';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP COLUMN zone');
        $this->addSql("ALTER TABLE vendor ADD price_type VARCHAR(20) NOT NULL DEFAULT 'per_service'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP COLUMN price_type');
        $this->addSql("ALTER TABLE vendor ADD zone VARCHAR(255) NOT NULL DEFAULT 'idf'");
    }
}
