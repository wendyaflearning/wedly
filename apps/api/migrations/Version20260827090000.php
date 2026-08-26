<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop provider_lead.unlocked: paid unlocking is off the table, vendor contact stays free (WED-130)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE provider_lead DROP unlocked');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE provider_lead ADD unlocked BOOLEAN DEFAULT TRUE NOT NULL');
    }
}
