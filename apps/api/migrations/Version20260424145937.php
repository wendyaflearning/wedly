<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260424145937 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Extend vendor.onboarding_step to VARCHAR(255) to support venue_characteristics and catering_characteristics steps';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE vendor ALTER onboarding_step TYPE VARCHAR(255)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE vendor ALTER onboarding_step TYPE VARCHAR(50)');
    }
}
