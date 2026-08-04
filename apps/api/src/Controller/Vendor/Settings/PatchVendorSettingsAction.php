<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Settings;

use App\DTO\Vendor\VendorSettingsRequestDto;
use App\DTO\Vendor\VendorSettingsResponseDto;
use App\Entity\User\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/settings', name: 'api_vendor_settings_patch', methods: ['PATCH'])]
final class PatchVendorSettingsAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    // TODO: Le changement d'email est appliqué sans flux de re-vérification.
    // Dette assumée MVP — à durcir en V2 (cf. backlog Notion module vendors).
    public function __invoke(#[MapRequestPayload] VendorSettingsRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $user->setFirstName($dto->firstName);
        $user->setLastName($dto->lastName);
        $user->setEmail($dto->email);

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return new JsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
        }

        return new JsonResponse(new VendorSettingsResponseDto(
            firstName: $user->getFirstName(),
            lastName:  $user->getLastName(),
            email:     $user->getEmail(),
        ));
    }
}
