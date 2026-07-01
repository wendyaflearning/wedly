<?php

declare(strict_types=1);

namespace App\Controller\Vendor\MatchingConsent;

use App\DTO\Vendor\VendorProfileStepRequestDto;
use App\Entity\User\User;
use App\Handler\Vendor\Onboarding\ConsentStepHandler;
use App\Handler\Vendor\Onboarding\ExperiencesStepHandler;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/matching-consent', name: 'api_vendor_matching_consent_post', methods: ['POST'])]
final class PostVendorMatchingConsentAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly ConsentStepHandler $handler,
        private readonly ExperiencesStepHandler $experiencesHandler,
        private readonly EntityManagerInterface $em,
    ) {}

    public function __invoke(string $id, #[MapRequestPayload] VendorProfileStepRequestDto $dto): JsonResponse
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

        try {
            $consent = $this->handler->record($vendor, $dto->data);

            if ($consent->isGranted()) {
                $this->experiencesHandler->handle($vendor, [
                    'culture_ids'    => $dto->data['culture_ids'] ?? [],
                    'confession_ids' => $dto->data['confession_ids'] ?? [],
                ]);
            } else {
                $vendor->getCultures()->clear();
                $vendor->getConfessions()->clear();
            }
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 422);
        }

        $this->em->flush();

        return new JsonResponse(['granted' => $consent->isGranted()], 201);
    }
}
