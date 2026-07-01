<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260704000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[data-fix] Remove vendor_culture associations pointing to country-type cultures';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DELETE FROM vendor_culture vc USING culture c WHERE c.id = vc.culture_id AND c.type = \'country\'');
    }

    public function down(Schema $schema): void
    {
        // Irreversible — deleted associations cannot be restored without source data
    }
}
