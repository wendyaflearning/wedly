<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260525000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Mise à jour des services racines + seed catégories Animations et Créateurs';
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

        // 5. Seed ANIMATIONS + CRÉATEURS (ON CONFLICT DO NOTHING = idempotent pour les envs qui ont déjà les fixtures)

        // Racines
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-000000000001', 'Animations', 'animations', 100, 'freelance', NULL, NOW(), NOW()),
                ('019da0ec-d800-7007-8007-000000000001', 'Créateurs',  'createurs',  123, 'createurs', NULL, NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Sous-groupes Animations
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-000000000002', 'Musicales',   'animations-musicales',   101, 'freelance', '019da0ec-d800-7006-8006-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000003', 'Artistiques', 'animations-artistiques', 107, 'freelance', '019da0ec-d800-7006-8006-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000004', 'Enfants',     'animations-enfants',     113, 'freelance', '019da0ec-d800-7006-8006-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000005', 'Culinaires',  'animations-culinaires',  118, 'freelance', '019da0ec-d800-7006-8006-000000000001', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Enfants Créateurs
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7007-8007-000000000002', 'Créatrice de robe de mariée',    'creatrice-robe-de-mariee',       124, 'createurs', '019da0ec-d800-7007-8007-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7007-8007-000000000003', 'Costumier / tailleur sur mesure', 'costumier-tailleur-sur-mesure', 125, 'createurs', '019da0ec-d800-7007-8007-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7007-8007-000000000004', 'Modiste',                          'modiste',                      126, 'createurs', '019da0ec-d800-7007-8007-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7007-8007-000000000005', 'Joaillerie',                       'joaillerie',                   127, 'createurs', '019da0ec-d800-7007-8007-000000000001', NOW(), NOW()),
                ('019da0ec-d800-7007-8007-000000000006', 'Papeterie mariage',                'papeterie-mariage',            128, 'createurs', '019da0ec-d800-7007-8007-000000000001', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Feuilles Musicales
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-000000000006', 'Groupe Live', 'groupe-live', 102, 'freelance', '019da0ec-d800-7006-8006-000000000002', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000007', 'Orchestre',   'orchestre',   103, 'freelance', '019da0ec-d800-7006-8006-000000000002', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000008', 'Harpe',       'harpe',       104, 'freelance', '019da0ec-d800-7006-8006-000000000002', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000009', 'Jazz Band',   'jazz-band',   105, 'freelance', '019da0ec-d800-7006-8006-000000000002', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-00000000000a', 'Chorale',     'chorale',     106, 'freelance', '019da0ec-d800-7006-8006-000000000002', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Feuilles Artistiques
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-00000000000b', 'Live Sketching', 'live-sketching', 108, 'freelance', '019da0ec-d800-7006-8006-000000000003', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-00000000000c', 'Magicien',       'magicien',       109, 'freelance', '019da0ec-d800-7006-8006-000000000003', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-00000000000d', 'Calligraphe',    'calligraphe',    110, 'freelance', '019da0ec-d800-7006-8006-000000000003', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-00000000000e', 'Danseurs',       'danseurs',       111, 'freelance', '019da0ec-d800-7006-8006-000000000003', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-00000000000f', 'Caricature',     'caricature',     112, 'freelance', '019da0ec-d800-7006-8006-000000000003', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Feuilles Enfants
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-000000000010', 'Babysitting',     'babysitting',      114, 'freelance', '019da0ec-d800-7006-8006-000000000004', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000011', 'Animateur',       'animateur-enfants', 115, 'freelance', '019da0ec-d800-7006-8006-000000000004', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000012', 'Conteur',         'conteur',          116, 'freelance', '019da0ec-d800-7006-8006-000000000004', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000013', 'Atelier créatif', 'atelier-creatif',  117, 'freelance', '019da0ec-d800-7006-8006-000000000004', NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        // Feuilles Culinaires
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7006-8006-000000000014', 'Bar à cocktail',       'bar-a-cocktail',    119, 'freelance', '019da0ec-d800-7006-8006-000000000005', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000015', 'Candy bar',            'candy-bar',         120, 'freelance', '019da0ec-d800-7006-8006-000000000005', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000016', 'Foodtruck',            'foodtruck',         121, 'freelance', '019da0ec-d800-7006-8006-000000000005', NOW(), NOW()),
                ('019da0ec-d800-7006-8006-000000000017', 'Animations culinaires', 'animation-culinaire', 122, 'freelance', '019da0ec-d800-7006-8006-000000000005', NOW(), NOW())
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
