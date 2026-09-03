<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828080000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add provider_lead.portfolio_image_id: the crush photo behind a contact request, and the source the request category is derived from (WED-131)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE provider_lead ADD portfolio_image_id UUID DEFAULT NULL');
        // ON DELETE SET NULL : une photo supprimée par le prestataire ne doit pas
        // emporter la demande de contact du couple avec elle.
        $this->addSql('ALTER TABLE provider_lead ADD CONSTRAINT FK_CD1902B7412F7FF5 FOREIGN KEY (portfolio_image_id) REFERENCES portfolio_image (id) ON DELETE SET NULL');
        // Noms générés par Doctrine : un nom lisible fait diverger
        // `doctrine:schema:validate` à chaque exécution.
        $this->addSql('CREATE INDEX IDX_CD1902B7412F7FF5 ON provider_lead (portfolio_image_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE provider_lead DROP CONSTRAINT FK_CD1902B7412F7FF5');
        $this->addSql('DROP INDEX IDX_CD1902B7412F7FF5');
        $this->addSql('ALTER TABLE provider_lead DROP portfolio_image_id');
    }
}
