<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;

final readonly class VendorCreatedResponse
{
    public string $id;
    public string $userId;
    public string $status;
    public string $inviteToken;
    public array $vendor;
    public array $user;

    public function __construct(
        Vendor $vendor,
        User $user,
        InviteToken $inviteToken,
        Service $service,
        array $regions,
    ) {
        $this->id          = $vendor->getId()->toRfc4122();
        $this->userId      = $user->getId()->toRfc4122();
        $this->status      = $user->getStatus()->value;
        $this->inviteToken = $inviteToken->getToken();

        $this->vendor = [
            'brand_name' => $vendor->getBrandName(),
            'price_min'  => $vendor->getPriceMinCents(),
            'price_max'  => $vendor->getPriceMaxCents(),
            'price_type' => $vendor->getPriceType()->value,
            'service'    => [
                'id'   => $service->getId()->toRfc4122(),
                'name' => $service->getName(),
            ],
            'regions' => array_map(
                fn(Region $region) => [
                    'id'   => $region->getId()->toRfc4122(),
                    'name' => $region->getName(),
                ],
                $regions
            ),
        ];

        $this->user = [
            'firstname' => $user->getFirstName(),
            'email'     => $user->getEmail(),
        ];
    }
}
