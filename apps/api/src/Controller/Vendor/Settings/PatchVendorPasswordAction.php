<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Settings;

use App\DTO\Vendor\ChangePasswordRequestDto;
use App\Entity\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/password', name: 'api_vendor_password_patch', methods: ['PATCH'])]
final class PatchVendorPasswordAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    // TODO: Le changement de mot de passe ne révoque pas les JWT déjà émis.
    // Dette assumée MVP — à durcir en V2 (cf. backlog Notion module vendors).
    public function __invoke(
        #[MapRequestPayload] ChangePasswordRequestDto $dto,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        /** @var User $user */
        $user = $this->security->getUser();

        if (!$passwordHasher->isPasswordValid($user, $dto->currentPassword)) {
            return new JsonResponse(['error' => 'Mot de passe actuel incorrect.'], 422);
        }

        $user->setPassword($passwordHasher->hashPassword($user, $dto->newPassword));
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'Mot de passe mis à jour.']);
    }
}
