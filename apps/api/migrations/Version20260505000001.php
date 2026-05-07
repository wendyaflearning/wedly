<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260505000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'portfolio_image: rename sort_seq to sort_order, add cloudinary_public_id';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image RENAME COLUMN sort_seq TO sort_order');
        $this->addSql('ALTER TABLE portfolio_image ADD cloudinary_public_id VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image DROP COLUMN cloudinary_public_id');
        $this->addSql('ALTER TABLE portfolio_image RENAME COLUMN sort_order TO sort_seq');
    }
}
