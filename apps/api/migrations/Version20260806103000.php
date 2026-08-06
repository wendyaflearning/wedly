<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260806103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du flag de visibilité Wedream sur portfolio_image (WED-100)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image ADD is_visible_in_wedream BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE portfolio_image DROP is_visible_in_wedream');
    }
}
