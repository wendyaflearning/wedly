<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align creator tables with Doctrine-generated schema (index names, column types)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER INDEX uniq_creator_value_slug RENAME TO UNIQ_92644E8A989D9B62');
        $this->addSql('ALTER TABLE vendor_creator_details ALTER creator_specialty TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE vendor_creator_details ALTER has_fixed_workshop DROP DEFAULT');
        $this->addSql('ALTER INDEX uniq_vcd_vendor_id RENAME TO UNIQ_A704FF46F603EE73');
        $this->addSql('ALTER INDEX idx_vcdcv_details_id RENAME TO IDX_62E1AAF1C3E420B9');
        $this->addSql('ALTER INDEX idx_vcdcv_value_id RENAME TO IDX_62E1AAF1AEC69C3E');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER INDEX UNIQ_92644E8A989D9B62 RENAME TO uniq_creator_value_slug');
        $this->addSql('ALTER TABLE vendor_creator_details ALTER creator_specialty TYPE VARCHAR(50)');
        $this->addSql('ALTER TABLE vendor_creator_details ALTER has_fixed_workshop SET DEFAULT FALSE');
        $this->addSql('ALTER INDEX UNIQ_A704FF46F603EE73 RENAME TO uniq_vcd_vendor_id');
        $this->addSql('ALTER INDEX IDX_62E1AAF1C3E420B9 RENAME TO idx_vcdcv_details_id');
        $this->addSql('ALTER INDEX IDX_62E1AAF1AEC69C3E RENAME TO idx_vcdcv_value_id');
    }
}
