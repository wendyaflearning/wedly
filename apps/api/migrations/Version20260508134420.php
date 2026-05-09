<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260508134420 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add category column to service table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE service ADD category VARCHAR(20)');
        $this->addSql("UPDATE service SET category = 'freelance' WHERE slug IN ('photographe','videaste','dj','fleuriste','wedding-planner','animateur','coiffeur','maquilleur','coiffeur-maquillage')");
        $this->addSql("UPDATE service SET category = 'traiteur' WHERE slug = 'traiteur'");
        $this->addSql("UPDATE service SET category = 'lieu' WHERE slug = 'lieu-de-reception'");
        $this->addSql('ALTER TABLE service ALTER COLUMN category SET NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE service DROP COLUMN category');
    }
}
