<?php

declare(strict_types=1);

namespace App\Controller\Onboarding;

use App\DTO\Onboarding\CoupleInviteTokenDataDto;
use App\DTO\Onboarding\InviteTokenResponseDto;
use App\DTO\Onboarding\VendorInviteTokenDataDto;
use App\Enum\User\InviteTokenPersona;
use App\Service\InviteTokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

readonly class ResolveInviteTokenAction
{
    public function __construct(
        private InviteTokenService $inviteTokenService,
    ) {}

    #[Route('/api/v1/invite-tokens/{token}', name: 'api_resolve_invite_token', methods: ['GET'])]
    public function __invoke(string $token): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);

            $data = match ($inviteToken->getPersona()) {
                InviteTokenPersona::Vendor => new VendorInviteTokenDataDto(
                    $inviteToken->getVendor() ?? throw new \DomainException('Aucun prestataire associé à ce token', 422)
                ),
                InviteTokenPersona::Couple => new CoupleInviteTokenDataDto(
                    $inviteToken->getCouple() ?? throw new \DomainException('Aucun couple associé à ce token', 422)
                ),
            };

            return new JsonResponse(new InviteTokenResponseDto($inviteToken->getPersona()->value, $data->data));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
