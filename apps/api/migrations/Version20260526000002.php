<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed creator_value reference data (7 values)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            INSERT INTO creator_value (id, name, slug, created_at, updated_at) VALUES
                ('019fe002-0001-7001-8001-000000000001', 'Authenticité',  'authenticity',   NOW(), NOW()),
                ('019fe002-0002-7002-8002-000000000002', 'Savoir-faire',  'craftsmanship',  NOW(), NOW()),
                ('019fe002-0003-7003-8003-000000000003', 'Écologie',      'ecology',        NOW(), NOW()),
                ('019fe002-0004-7004-8004-000000000004', 'Excellence',    'excellence',     NOW(), NOW()),
                ('019fe002-0005-7005-8005-000000000005', 'Transmission',  'transmission',   NOW(), NOW()),
                ('019fe002-0006-7006-8006-000000000006', 'Créativité',    'creativity',     NOW(), NOW()),
                ('019fe002-0007-7007-8007-000000000007', 'Artisanat',     'artisanal',      NOW(), NOW())
            ON CONFLICT DO NOTHING
        SQL);
    }

    public function down(Schema $schema): void
    {
        throw new \LogicException('This migration is irreversible.');
    }
}
