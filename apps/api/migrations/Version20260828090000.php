<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add app_user.unsubscribed_at: durable email opt-out, person-level not vendor-level (WED-145)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user ADD unsubscribed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user DROP unsubscribed_at');
    }
}
