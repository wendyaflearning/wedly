<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260622000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add vendor admin review metadata and rejected status constraint';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                ADD submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                ADD reviewed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                ADD rejection_reasons JSON DEFAULT NULL,
                ADD rejection_note TEXT DEFAULT NULL
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                ADD CONSTRAINT chk_vendor_status CHECK (status IN ('pending', 'under_review', 'active', 'rejected'))
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vendor DROP CONSTRAINT chk_vendor_status');

        $this->addSql(<<<'SQL'
            ALTER TABLE vendor
                DROP submitted_for_review_at,
                DROP reviewed_at,
                DROP rejection_reasons,
                DROP rejection_note
        SQL);
    }
}
