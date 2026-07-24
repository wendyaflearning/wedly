<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260724090001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Corrige le slug de la région PACA (tiret manquant) — merge-safe si un doublon existe déjà';
    }

    public function up(Schema $schema): void
    {
        // region.slug est UNIQUE (uniq_f62f176989d9b62) : un simple UPDATE échouerait si une
        // ligne 'provence-alpes-cote-d-azur' existe déjà (cas constaté en local, cf. rapport —
        // vraisemblablement une exécution ponctuelle de RegionFixtures.php hors migrations).
        // On traite donc les deux cas : fusion si doublon, renommage simple sinon.

        // 1. Si le slug correct existe déjà, reporter les vendor_zones du slug fautif dessus
        $this->addSql(<<<'SQL'
            INSERT INTO vendor_zones (vendor_id, region_id)
            SELECT vz.vendor_id, correct.id
            FROM vendor_zones vz
            JOIN region wrong ON wrong.id = vz.region_id AND wrong.slug = 'provence-alpes-cote-dazur'
            JOIN region correct ON correct.slug = 'provence-alpes-cote-d-azur'
            ON CONFLICT (vendor_id, region_id) DO NOTHING
        SQL);

        // 2. Supprimer les rattachements désormais dupliqués sur le slug fautif (uniquement si le doublon existe)
        $this->addSql(<<<'SQL'
            DELETE FROM vendor_zones
            WHERE region_id = (SELECT id FROM region WHERE slug = 'provence-alpes-cote-dazur')
              AND EXISTS (SELECT 1 FROM region WHERE slug = 'provence-alpes-cote-d-azur')
        SQL);

        // 3. Supprimer la ligne region dupliquée (uniquement si le doublon existe)
        $this->addSql(<<<'SQL'
            DELETE FROM region
            WHERE slug = 'provence-alpes-cote-dazur'
              AND EXISTS (SELECT 1 FROM region WHERE slug = 'provence-alpes-cote-d-azur')
        SQL);

        // 4. Sinon (pas de doublon), simple renommage — no-op si la ligne a déjà été supprimée à l'étape 3
        $this->addSql(<<<'SQL'
            UPDATE region SET slug = 'provence-alpes-cote-d-azur'
            WHERE slug = 'provence-alpes-cote-dazur'
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Rollback best-effort : si un merge a eu lieu à l'up (doublon détecté), l'id et les
        // timestamps d'origine de la ligne fautive sont perdus, et les vendor_zones reportées
        // ne peuvent pas être désambiguïsées de celles déjà présentes sur le slug correct.
        // Ce down() ne fait que le cas symétrique du renommage simple (pas de merge à l'up).
        $this->addSql(<<<'SQL'
            UPDATE region SET slug = 'provence-alpes-cote-dazur'
            WHERE slug = 'provence-alpes-cote-d-azur'
        SQL);
    }
}
