<?php

declare(strict_types=1);

namespace App\Service\Admin;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use Doctrine\DBAL\Connection;

final readonly class UserDeleteService
{
    private const VENDOR_CHILD_TABLES = [
        'offer',
        'portfolio_image',
        'booking_blocker',
        'vendor_consent',
        'vendor_service',
        'vendor_style',
        'vendor_culture',
        'vendor_confession',
        'vendor_zones',
        'vendor_venue_details',
        'vendor_catering_details',
        'vendor_animation_details',
        'vendor_creator_details',
    ];

    public function __construct(
        private Connection $connection,
    ) {}

    /** @return list<array{table: string, rows: int}> */
    public function getDryRunReport(User $user, ?Vendor $vendor): array
    {
        $report = [];

        foreach (self::VENDOR_CHILD_TABLES as $table) {
            $count = 0;
            if ($vendor !== null) {
                $count = (int) $this->connection->fetchOne(
                    "SELECT COUNT(*) FROM {$table} WHERE vendor_id = :vendorId",
                    ['vendorId' => $vendor->getId()->toRfc4122()],
                );
            }
            $report[] = ['table' => $table, 'rows' => $count];
        }

        return $report;
    }

    public function delete(User $user, ?Vendor $vendor): void
    {
        $this->connection->beginTransaction();
        try {
            if ($vendor !== null) {
                $vendorId = $vendor->getId()->toRfc4122();
                foreach (self::VENDOR_CHILD_TABLES as $table) {
                    $this->connection->executeStatement(
                        "DELETE FROM {$table} WHERE vendor_id = :vendorId",
                        ['vendorId' => $vendorId],
                    );
                }
                $this->connection->executeStatement(
                    'DELETE FROM vendor WHERE id = :vendorId',
                    ['vendorId' => $vendorId],
                );
            }

            $this->connection->executeStatement(
                'DELETE FROM app_user WHERE id = :userId',
                ['userId' => $user->getId()->toRfc4122()],
            );

            $this->connection->commit();
        } catch (\Throwable $e) {
            $this->connection->rollBack();
            throw $e;
        }
    }
}
