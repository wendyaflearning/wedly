<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename join table vendor_creator_details_creator_value to vendor_creator_value';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value DROP CONSTRAINT fk_vcdcv_details_id');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value DROP CONSTRAINT fk_vcdcv_value_id');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value RENAME TO vendor_creator_value');
        $this->addSql('ALTER INDEX IDX_62E1AAF1C3E420B9 RENAME TO IDX_1AC7161DC3E420B9');
        $this->addSql('ALTER INDEX IDX_62E1AAF1AEC69C3E RENAME TO IDX_1AC7161DAEC69C3E');
        $this->addSql('ALTER TABLE vendor_creator_value ADD CONSTRAINT FK_1AC7161DC3E420B9 FOREIGN KEY (creator_details_id) REFERENCES vendor_creator_details (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE vendor_creator_value ADD CONSTRAINT FK_1AC7161DAEC69C3E FOREIGN KEY (creator_value_id) REFERENCES creator_value (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_creator_value DROP CONSTRAINT FK_1AC7161DC3E420B9');
        $this->addSql('ALTER TABLE vendor_creator_value DROP CONSTRAINT FK_1AC7161DAEC69C3E');
        $this->addSql('ALTER TABLE vendor_creator_value RENAME TO vendor_creator_details_creator_value');
        $this->addSql('ALTER INDEX IDX_1AC7161DC3E420B9 RENAME TO IDX_62E1AAF1C3E420B9');
        $this->addSql('ALTER INDEX IDX_1AC7161DAEC69C3E RENAME TO IDX_62E1AAF1AEC69C3E');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value ADD CONSTRAINT fk_vcdcv_details_id FOREIGN KEY (creator_details_id) REFERENCES vendor_creator_details (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value ADD CONSTRAINT fk_vcdcv_value_id FOREIGN KEY (creator_value_id) REFERENCES creator_value (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
