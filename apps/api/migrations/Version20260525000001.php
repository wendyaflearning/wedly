<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260525000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Mise à jour des services racines : suppressions, renommages, ajout Décoration, réordonnancement';
    }

    public function up(Schema $schema): void
    {
        // 1. Suppressions
        $this->addSql("DELETE FROM vendor_service WHERE service_id = (SELECT id FROM service WHERE slug = 'animateur' AND parent_id IS NULL)");
        $this->addSql("DELETE FROM service WHERE slug = 'animateur' AND parent_id IS NULL");

        $this->addSql("DELETE FROM vendor_service WHERE service_id = (SELECT id FROM service WHERE slug = 'wedding-planner')");
        $this->addSql("DELETE FROM service WHERE slug = 'wedding-planner'");

        // 2. Renommages
        $this->addSql("UPDATE service SET name = 'Coiffeuse & MUA', slug = 'coiffeuse-et-mua', updated_at = NOW() WHERE slug = 'coiffeur-maquillage'");
        $this->addSql("UPDATE service SET name = 'Makeup artist',   slug = 'makeup-artist',   updated_at = NOW() WHERE slug = 'maquilleur'");

        // 3. Ajout de Décoration
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at)
            VALUES ('019da0ec-d800-7001-8001-00000000000b', 'Décoration', 'decoration', 3, 'freelance', NULL, NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // 4. Réordonnancement
        $this->addSql("UPDATE service SET sort_order = 1,  updated_at = NOW() WHERE slug = 'lieu-de-reception'");
        $this->addSql("UPDATE service SET sort_order = 2,  updated_at = NOW() WHERE slug = 'traiteur'");
        $this->addSql("UPDATE service SET sort_order = 3,  updated_at = NOW() WHERE slug = 'decoration'");
        $this->addSql("UPDATE service SET sort_order = 4,  updated_at = NOW() WHERE slug = 'photographe'");
        $this->addSql("UPDATE service SET sort_order = 5,  updated_at = NOW() WHERE slug = 'videaste'");
        $this->addSql("UPDATE service SET sort_order = 6,  updated_at = NOW() WHERE slug = 'coiffeur'");
        $this->addSql("UPDATE service SET sort_order = 7,  updated_at = NOW() WHERE slug = 'makeup-artist'");
        $this->addSql("UPDATE service SET sort_order = 8,  updated_at = NOW() WHERE slug = 'coiffeuse-et-mua'");
        $this->addSql("UPDATE service SET sort_order = 9,  updated_at = NOW() WHERE slug = 'fleuriste'");
        $this->addSql("UPDATE service SET sort_order = 10, updated_at = NOW() WHERE slug = 'dj'");
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
