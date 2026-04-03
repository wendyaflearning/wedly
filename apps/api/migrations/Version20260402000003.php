<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Renommage : table style → wedding_style, colonne plan.category_count → service_count.
 */
final class Version20260402000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename style → wedding_style, plan.category_count → service_count';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE style RENAME TO wedding_style');
        $this->addSql('ALTER INDEX UNIQ_33BDB86A989D9B62 RENAME TO UNIQ_33F464BE989D9B62');
        $this->addSql('ALTER TABLE plan RENAME COLUMN category_count TO service_count');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE wedding_style RENAME TO style');
        $this->addSql('ALTER INDEX UNIQ_33F464BE989D9B62 RENAME TO UNIQ_33BDB86A989D9B62');
        $this->addSql('ALTER TABLE plan RENAME COLUMN service_count TO category_count');
    }
}
