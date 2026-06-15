<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\Service\InviteTokenService;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class PostVendorOnboardingPortfolioAction
{
    public function __construct(
        private InviteTokenService  $inviteTokenService,
        private PortfolioStepHandler $portfolioStepHandler,
        private ValidatorInterface   $validator,
    ) {}

    #[Route('/api/v1/vendors/onboarding/{token}/portfolio', name: 'api_vendor_onboarding_portfolio', methods: ['POST'])]
    public function __invoke(string $token, Request $request): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);
            $vendor      = $inviteToken->getVendor();

            if (null === $vendor) {
                throw new \DomainException('Aucun prestataire associé à ce token', 422);
            }

            $dto        = PortfolioStepRequestDto::fromRequest($request);
            $violations = $this->validator->validate($dto);

            if (count($violations) > 0) {
                $errors = [];
                foreach ($violations as $violation) {
                    $errors[] = $violation->getPropertyPath().': '.$violation->getMessage();
                }

                return new JsonResponse(['errors' => $errors], 422);
            }

            $this->portfolioStepHandler->upload($vendor, $dto);

            $data = $this->portfolioStepHandler->getStepData($vendor);

            return new JsonResponse(['images' => $data['images'] ?? []]);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
