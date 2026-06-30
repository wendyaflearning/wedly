<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\Service;

final readonly class AdminVendorInvitationResponseDto
{
    public string $id;
    public string $token;
    public string $vendorId;
    public string $brandName;
    public string $firstname;
    public string $email;
    public string $createdAt;
    public string $expiresAt;
    public array $service;
    public array $regions;

    public function __construct(InviteToken $inviteToken)
    {
        $vendor = $inviteToken->getVendor() ?? throw new \DomainException('Invitation vendor missing vendor.', 422);
        $user   = $inviteToken->getUser() ?? throw new \DomainException('Invitation vendor missing user.', 422);

        $service = $vendor->getServices()->first();

        $this->id        = $inviteToken->getId()->toRfc4122();
        $this->token     = $inviteToken->getToken();
        $this->vendorId  = $vendor->getId()->toRfc4122();
        $this->brandName = $vendor->getBrandName();
        $this->firstname = $user->getFirstName();
        $this->email     = $user->getEmail();
        $this->createdAt = $inviteToken->getCreatedAt()->format(\DateTimeInterface::ATOM);
        $this->expiresAt = $inviteToken->getExpiresAt()->format(\DateTimeInterface::ATOM);
        $this->service   = $service instanceof Service ? [
            'id'   => $service->getId()->toRfc4122(),
            'name' => $service->getName(),
        ] : [
            'id'   => null,
            'name' => 'Non renseigné',
        ];
        $this->regions = array_map(
            fn(Region $region) => [
                'id'   => $region->getId()->toRfc4122(),
                'name' => $region->getName(),
            ],
            $vendor->getRegions()->toArray()
        );
    }
}
