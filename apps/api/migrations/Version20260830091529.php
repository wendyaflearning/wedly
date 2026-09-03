<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260830091529 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add a unique index on provider_lead (couple_id, vendor_id) (WED-152)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE UNIQUE INDEX UNIQ_provider_lead_couple_vendor ON provider_lead (couple_id, vendor_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_provider_lead_couple_vendor');
    }
}
