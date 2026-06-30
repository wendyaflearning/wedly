<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\VendorRepository;

class VendorOwnershipResolver
{
    public function __construct(private readonly VendorRepository $vendorRepository) {}

    /**
     * @throws \DomainException 403 if the connected user does not own the requested vendor
     */
    public function resolve(User $user): Vendor
    {
        $vendor = $this->vendorRepository->findOneByUser($user);

        if ($vendor === null) {
            throw new \DomainException('Accès interdit.', 403);
        }

        return $vendor;
    }

    /**
     * @throws \DomainException 403 if the connected vendor is not active
     */
    public function resolveActive(User $user): Vendor
    {
        $vendor = $this->resolve($user);

        if ($vendor->getStatus() !== VendorStatus::Active) {
            throw new \DomainException('Profil en attente de validation - cela peut prendre 24h à 48h.', 403);
        }

        return $vendor;
    }
}
