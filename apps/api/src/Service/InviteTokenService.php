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
     * @throws \DomainException 404 if token not found, 410 if expired or already consumed
     */
    public function consume(InviteToken $inviteToken): void
    {
        $inviteToken->setStatus(InviteTokenStatus::Used);
        $this->em->flush();
    }

    public function resolve(string $token): InviteToken
    {
        $inviteToken = $this->em->getRepository(InviteToken::class)->findOneBy(['token' => $token]);

        if (null === $inviteToken) {
            throw new \DomainException('Token invalide', 404);
        }

        if (InviteTokenStatus::Pending !== $inviteToken->getStatus()) {
            throw new \DomainException('Token déjà utilisé', 410);
        }

        if ($inviteToken->getExpiresAt() < new \DateTimeImmutable()) {
            $inviteToken->setStatus(InviteTokenStatus::Expired);
            $this->em->flush();

            throw new \DomainException('Token expiré', 410);
        }

        return $inviteToken;
    }
}
