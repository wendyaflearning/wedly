<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Consent;

use App\DTO\Vendor\VendorProfileStepRequestDto;
use App\Entity\User\User;
use App\Handler\Vendor\Onboarding\ConsentStepHandler;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/consent', name: 'api_vendor_consent_post', methods: ['POST'])]
final class PostVendorConsentAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly ConsentStepHandler $handler,
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
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 422);
        }

        $this->em->flush();

        return new JsonResponse(['granted' => $consent->isGranted()], 201);
    }
}
