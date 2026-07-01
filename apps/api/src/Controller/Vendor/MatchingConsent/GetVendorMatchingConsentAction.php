<?php

declare(strict_types=1);

namespace App\Controller\Vendor\MatchingConsent;

use App\DTO\Vendor\VendorMatchingConsentResponseDto;
use App\Entity\User\User;
use App\Handler\Vendor\Onboarding\ConsentStepHandler;
use App\Handler\Vendor\Onboarding\ExperiencesStepHandler;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/matching-consent', name: 'api_vendor_matching_consent_get', methods: ['GET'])]
final class GetVendorMatchingConsentAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly ConsentStepHandler $consentHandler,
        private readonly ExperiencesStepHandler $experiencesHandler,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        /** @var User $user */
        $user = $this->security->getUser();
        if ($vendor->getUser() !== $user) {
            return new JsonResponse(['error' => 'Access denied.'], 403);
        }

        $consentData     = $this->consentHandler->getStepData($vendor);
        $experiencesData = $this->experiencesHandler->getStepData($vendor);

        return new JsonResponse(new VendorMatchingConsentResponseDto(
            granted:       $consentData['granted'] ?? null,
            confessionIds: $experiencesData['confession_ids'] ?? [],
            cultureIds:    $experiencesData['culture_ids'] ?? [],
        ));
    }
}
