<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260819140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la vignette de sous-catégorie sur tag_value (WED-117)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tag_value ADD vignette_url VARCHAR(512) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tag_value DROP vignette_url');
    }
}
