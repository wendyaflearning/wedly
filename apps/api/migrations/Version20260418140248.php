<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260418140248 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'AlterVendorNullableFields — description, siret, address, zipcode, city';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE vendor ALTER description DROP NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER siret DROP NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER address DROP NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER zipcode DROP NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER city DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE vendor ALTER description SET NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER siret SET NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER address SET NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER zipcode SET NOT NULL');
        $this->addSql('ALTER TABLE vendor ALTER city SET NOT NULL');
    }
}
