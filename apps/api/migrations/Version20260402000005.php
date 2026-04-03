<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Correctif WeddingStyle : renomme wedding_style → style pour libérer le nom de la table de jointure.
 */
final class Version20260402000005 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename wedding_style → style (free up join table name)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE wedding_style RENAME TO style');
        $this->addSql('ALTER INDEX UNIQ_33F464BE989D9B62 RENAME TO UNIQ_33BDB86A989D9B62');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE style RENAME TO wedding_style');
        $this->addSql('ALTER INDEX UNIQ_33BDB86A989D9B62 RENAME TO UNIQ_33F464BE989D9B62');
    }
}
