<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260812072133 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de couple.planning_stage et passage en nullable de wedding.zone/ambiance/ceremony_type (WED-106)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE couple ADD planning_stage VARCHAR(20) DEFAULT 'just_started' NOT NULL");
        $this->addSql('ALTER TABLE couple ALTER planning_stage DROP DEFAULT');

        $this->addSql('ALTER TABLE wedding ALTER zone DROP NOT NULL');
        $this->addSql('ALTER TABLE wedding ALTER ambiance DROP NOT NULL');
        $this->addSql('ALTER TABLE wedding ALTER ceremony_type DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE wedding ALTER ceremony_type SET NOT NULL');
        $this->addSql('ALTER TABLE wedding ALTER ambiance SET NOT NULL');
        $this->addSql('ALTER TABLE wedding ALTER zone SET NOT NULL');

        $this->addSql('ALTER TABLE couple DROP planning_stage');
    }
}
