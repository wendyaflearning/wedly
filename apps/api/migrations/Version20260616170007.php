<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260616170007 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add bio (text, nullable) and is_published (boolean, default false) to vendor';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor ADD bio TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE vendor ADD is_published BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP bio');
        $this->addSql('ALTER TABLE vendor DROP is_published');
    }
}
