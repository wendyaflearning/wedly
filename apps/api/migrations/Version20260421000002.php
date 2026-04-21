<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260421000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add is_cover to portfolio_image; add nearest_city to vendor_venue_details';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE portfolio_image
                ADD COLUMN is_cover BOOLEAN NOT NULL DEFAULT FALSE
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE vendor_venue_details
                ADD COLUMN nearest_city VARCHAR(100) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE vendor_venue_details
                DROP COLUMN nearest_city
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE portfolio_image
                DROP COLUMN is_cover
        SQL);
    }
}
