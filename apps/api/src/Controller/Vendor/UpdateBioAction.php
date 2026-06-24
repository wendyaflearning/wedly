<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\DTO\Vendor\UpdateBioRequestDto;
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
#[Route('/api/v1/vendors/me/bio', name: 'api_vendor_bio_update', methods: ['PATCH'])]
final class UpdateBioAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    public function __invoke(#[MapRequestPayload] UpdateBioRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorRepository->findOneByUser($user);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'No vendor associated with this account.'], 403);
        }

        $vendor->setBio($dto->bio);
        $this->entityManager->flush();

        return new JsonResponse(['bio' => $vendor->getBio()]);
    }
}
