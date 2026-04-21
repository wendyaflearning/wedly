<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User\InviteToken;
use App\Enum\User\InviteTokenStatus;
use Doctrine\ORM\EntityManagerInterface;

readonly class InviteTokenService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    /**
     * @throws \DomainException 404 if token not found, 410 if already consumed
     * TODO: implement expires_at check in V2
     */
    public function resolve(string $token): InviteToken
    {
        $inviteToken = $this->em->getRepository(InviteToken::class)->findOneBy(['token' => $token]);

        if (null === $inviteToken) {
            throw new \DomainException('Token invalide', 404);
        }

        if (InviteTokenStatus::Pending !== $inviteToken->getStatus()) {
            throw new \DomainException('Token déjà utilisé', 410);
        }

        return $inviteToken;
    }
}
