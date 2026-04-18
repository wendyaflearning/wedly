<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260418160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed reference data — service, region, culture, confession, style';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            INSERT INTO service (id, name, slug, sort_order, parent_id, created_at, updated_at) VALUES
                ('019da0ec-d800-7001-8001-000000000001', 'Photographe',       'photographe',       1,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000002', 'Vidéaste',          'videaste',          2,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000003', 'DJ',                'dj',                3,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000004', 'Traiteur',          'traiteur',          4,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000005', 'Fleuriste',         'fleuriste',         5,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000006', 'Wedding Planner',   'wedding-planner',   6,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000007', 'Lieu de réception', 'lieu-de-reception', 7,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000008', 'Animateur',         'animateur',         8,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-000000000009', 'Coiffeur',          'coiffeur',          9,  NULL, NOW(), NOW()),
                ('019da0ec-d800-7001-8001-00000000000a', 'Maquilleur',        'maquilleur',        10, NULL, NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO region (id, name, slug, created_at, updated_at) VALUES
                ('019da0ec-d800-7002-8002-000000000001', 'Auvergne-Rhône-Alpes',         'auvergne-rhone-alpes',       NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000002', 'Bourgogne-Franche-Comté',      'bourgogne-franche-comte',    NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000003', 'Bretagne',                     'bretagne',                   NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000004', 'Centre-Val de Loire',          'centre-val-de-loire',        NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000005', 'Corse',                        'corse',                      NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000006', 'Grand Est',                    'grand-est',                  NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000007', 'Hauts-de-France',              'hauts-de-france',            NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000008', 'Île-de-France',                'ile-de-france',              NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000009', 'Normandie',                    'normandie',                  NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000a', 'Nouvelle-Aquitaine',           'nouvelle-aquitaine',         NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000b', 'Occitanie',                    'occitanie',                  NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000c', 'Pays de la Loire',             'pays-de-la-loire',           NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000d', 'Provence-Alpes-Côte d''Azur',  'provence-alpes-cote-d-azur', NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000e', 'Guadeloupe',                   'guadeloupe',                 NOW(), NOW()),
                ('019da0ec-d800-7002-8002-00000000000f', 'Martinique',                   'martinique',                 NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000010', 'Guyane',                       'guyane',                     NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000011', 'La Réunion',                   'la-reunion',                 NOW(), NOW()),
                ('019da0ec-d800-7002-8002-000000000012', 'Mayotte',                      'mayotte',                    NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO culture (id, name, slug, type, created_at, updated_at) VALUES
                ('019da0ec-d800-7003-8003-000000000001', 'Europe',          'europe',         'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000002', 'Afrique',         'afrique',        'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000003', 'Asie',            'asie',           'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000004', 'Amérique',        'amerique',       'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000005', 'Moyen-Orient',    'moyen-orient',   'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000006', 'Maghreb',         'maghreb',        'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000007', 'Océanie',         'oceanie',        'continent', NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000010', 'France',          'france',         'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000011', 'Maroc',           'maroc',          'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000012', 'Sénégal',         'senegal',        'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000013', 'Algérie',         'algerie',        'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000014', 'Tunisie',         'tunisie',        'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000015', 'Portugal',        'portugal',       'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000016', 'Italie',          'italie',         'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000017', 'Espagne',         'espagne',        'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000018', 'Liban',           'liban',          'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-000000000019', 'Cameroun',        'cameroun',       'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-00000000001a', 'Côte d''Ivoire',  'cote-d-ivoire',  'country',   NOW(), NOW()),
                ('019da0ec-d800-7003-8003-00000000001b', 'Madagascar',      'madagascar',     'country',   NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO confession (id, name, slug, created_at, updated_at) VALUES
                ('019da0ec-d800-7004-8004-000000000001', 'Catholique',  'catholique',  NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000002', 'Musulman',    'musulman',    NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000003', 'Juif',        'juif',        NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000004', 'Protestant',  'protestant',  NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000005', 'Laïc',        'laic',        NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000006', 'Orthodoxe',   'orthodoxe',   NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000007', 'Bouddhiste',  'bouddhiste',  NOW(), NOW()),
                ('019da0ec-d800-7004-8004-000000000008', 'Hindou',      'hindou',      NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);

        $this->addSql(<<<'SQL'
            INSERT INTO style (id, name, slug, description, cover_image_url, created_at, updated_at) VALUES
                ('019da0ec-d800-7005-8005-000000000001', 'Champêtre',   'champetre',   NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000002', 'Bohème',      'boheme',      NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000003', 'Moderne',     'moderne',     NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000004', 'Classique',   'classique',   NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000005', 'Romantique',  'romantique',  NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000006', 'Minimaliste', 'minimaliste', NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000007', 'Luxe',        'luxe',        NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000008', 'Vintage',     'vintage',     NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-000000000009', 'Tropical',    'tropical',    NULL, NULL, NOW(), NOW()),
                ('019da0ec-d800-7005-8005-00000000000a', 'Oriental',    'oriental',    NULL, NULL, NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
