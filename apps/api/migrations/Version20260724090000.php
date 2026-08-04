<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260724090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Split service MUA : maquillage/coiffure — suppression makeup-artist/coiffeur/coiffeuse-et-mua';
    }

    public function up(Schema $schema): void
    {
        // 1. Créer les nouveaux services canoniques (idempotent)
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019f9366-3192-78c0-8017-0cbd6bdd6b80', 'Coiffure',   'coiffure',   6, 'freelance', NULL, NOW(), NOW()),
                ('019f9366-3192-7bc5-8c8e-3d3edc50db46', 'Maquillage', 'maquillage', 7, 'freelance', NULL, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
        SQL);

        // 2. Reporter les rattachements vendor_service de makeup-artist vers maquillage
        $this->addSql(<<<'SQL'
            UPDATE vendor_service
            SET service_id = (SELECT id FROM service WHERE slug = 'maquillage')
            WHERE service_id = (SELECT id FROM service WHERE slug = 'makeup-artist')
        SQL);

        // 3. Supprimer les anciens slugs — échoue volontairement (FK_FFEAA2BDED5CA9E6)
        //    s'il reste une référence vendor_service orpheline sur coiffeur/coiffeuse-et-mua
        $this->addSql("DELETE FROM service WHERE slug IN ('makeup-artist', 'coiffeur', 'coiffeuse-et-mua')");
    }

    public function down(Schema $schema): void
    {
        // Rollback best-effort : les anciennes lignes de service (ids, sort_order, timestamps
        // d'origine) sont définitivement perdues après le DELETE de up(). Ce down() recrée les
        // trois slugs fonctionnellement à l'identique et reporte les vendor_service de
        // maquillage vers makeup-artist, mais PAS de coiffure vers coiffeur/coiffeuse-et-mua :
        // rien ne permet de savoir laquelle des deux ces vendor_service visaient avant le split
        // (l'irréversibilité est assumée ici, comme dans Version20260418160000.php et
        // Version20260525000001.php qui font déjà ce choix sur ce même fichier de migrations).
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, category, parent_id, created_at, updated_at) VALUES
                ('019f9366-4a10-70c1-8def-1a2b3c4d5e01', 'Coiffeur',        'coiffeur',         6, 'freelance', NULL, NOW(), NOW()),
                ('019f9366-4a10-7145-8def-1a2b3c4d5e02', 'Makeup artist',   'makeup-artist',    7, 'freelance', NULL, NOW(), NOW()),
                ('019f9366-4a10-71c8-8def-1a2b3c4d5e03', 'Coiffeuse & MUA', 'coiffeuse-et-mua', 8, 'freelance', NULL, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            UPDATE vendor_service
            SET service_id = (SELECT id FROM service WHERE slug = 'makeup-artist')
            WHERE service_id = (SELECT id FROM service WHERE slug = 'maquillage')
        SQL);

        $this->addSql("DELETE FROM service WHERE slug IN ('maquillage', 'coiffure')");
    }
}
