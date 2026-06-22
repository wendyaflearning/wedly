<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\VendorRepository;

class VendorOwnershipResolver
{
    public function __construct(private readonly VendorRepository $vendorRepository) {}

    /**
     * @throws \DomainException 403 if the connected user does not own the requested vendor
     */
    public function resolve(User $user, string $vendorId): Vendor
    {
        $vendor = $this->vendorRepository->findOneByUser($user);

        if ($vendor === null || $vendor->getId()->toRfc4122() !== $vendorId) {
            throw new \DomainException('Accès interdit.', 403);
        }

        return $vendor;
    }
}
