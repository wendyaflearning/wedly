<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Onboarding;

use App\Dispatcher\Vendor\Onboarding\VendorOnboardingStepDispatcher;
use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\Service\InviteTokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class PatchVendorOnboardingStepAction
{
    public function __construct(
        private InviteTokenService $inviteTokenService,
        private ValidatorInterface $validator,
        private VendorOnboardingStepDispatcher $stepService,
    ) {}

    #[Route('/api/v1/vendors/onboarding/{token}', name: 'api_vendor_onboarding_step', methods: ['PATCH'])]
    public function __invoke(string $token, Request $request): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);
            $vendor      = $inviteToken->getVendor();

            if (null === $vendor) {
                throw new \DomainException('Aucun prestataire associé à ce token', 422);
            }

            $body = json_decode($request->getContent(), true) ?? [];
            $dto  = new VendorOnboardingStepRequestDto(
                step: $body['step'] ?? '',
                data: array_key_exists('data', $body) ? $body['data'] : null,
            );

            $violations = $this->validator->validate($dto);
            if (count($violations) > 0) {
                $errors = [];
                foreach ($violations as $violation) {
                    $errors[] = $violation->getPropertyPath().': '.$violation->getMessage();
                }

                return new JsonResponse(['errors' => $errors], 422);
            }
            $response = $this->stepService->handle($vendor, $dto);

            if ($response === null) {
                $this->inviteTokenService->consume($inviteToken);
                return new JsonResponse(null, Response::HTTP_NO_CONTENT);
            }

            return new JsonResponse($response);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
