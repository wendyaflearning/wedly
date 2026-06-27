<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\DTO\Vendor\PatchBioRequestDto;
use App\DTO\Vendor\PatchBioResponseDto;
use App\Entity\User\User;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/bio', name: 'api_vendor_bio_patch', methods: ['PATCH'])]
final class PatchBioAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    public function __invoke(string $id, #[MapRequestPayload] PatchBioRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        if ($vendor->getUser()->getId() !== $user->getId()) {
            return new JsonResponse(['error' => 'Access denied.'], 403);
        }

        $vendor->setBio($dto->bio);
        $this->entityManager->flush();

        return new JsonResponse(new PatchBioResponseDto($vendor->getBio()));
    }
}
