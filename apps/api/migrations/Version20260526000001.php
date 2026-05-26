<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create creator_value, vendor_creator_details and their join table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE creator_value (
                id UUID NOT NULL,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);

        $this->addSql('CREATE UNIQUE INDEX UNIQ_creator_value_slug ON creator_value (slug)');

        $this->addSql(<<<'SQL'
            CREATE TABLE vendor_creator_details (
                id UUID NOT NULL,
                vendor_id UUID NOT NULL,
                creator_specialty VARCHAR(50) NOT NULL,
                has_fixed_workshop BOOLEAN NOT NULL DEFAULT FALSE,
                min_lead_time_months SMALLINT DEFAULT NULL,
                annual_capacity SMALLINT DEFAULT NULL,
                rdv_count SMALLINT DEFAULT NULL,
                first_rdv_duration_minutes SMALLINT DEFAULT NULL,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);

        $this->addSql('CREATE UNIQUE INDEX UNIQ_vcd_vendor_id ON vendor_creator_details (vendor_id)');
        $this->addSql('ALTER TABLE vendor_creator_details ADD CONSTRAINT FK_vcd_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendor (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE vendor_creator_details_creator_value (
                creator_details_id UUID NOT NULL,
                creator_value_id UUID NOT NULL,
                PRIMARY KEY(creator_details_id, creator_value_id)
            )
        SQL);

        $this->addSql('CREATE INDEX IDX_vcdcv_details_id ON vendor_creator_details_creator_value (creator_details_id)');
        $this->addSql('CREATE INDEX IDX_vcdcv_value_id ON vendor_creator_details_creator_value (creator_value_id)');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value ADD CONSTRAINT FK_vcdcv_details_id FOREIGN KEY (creator_details_id) REFERENCES vendor_creator_details (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value ADD CONSTRAINT FK_vcdcv_value_id FOREIGN KEY (creator_value_id) REFERENCES creator_value (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value DROP CONSTRAINT FK_vcdcv_details_id');
        $this->addSql('ALTER TABLE vendor_creator_details_creator_value DROP CONSTRAINT FK_vcdcv_value_id');
        $this->addSql('DROP TABLE vendor_creator_details_creator_value');
        $this->addSql('ALTER TABLE vendor_creator_details DROP CONSTRAINT FK_vcd_vendor_id');
        $this->addSql('DROP TABLE vendor_creator_details');
        $this->addSql('DROP TABLE creator_value');
    }
}
