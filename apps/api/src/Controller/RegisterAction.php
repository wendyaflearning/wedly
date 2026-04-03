<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\RegisterDTO;
use App\Entity\User;
use App\Enum\Role;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class RegisterAction
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $em,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('/api/v1/register', name: 'api_register', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] RegisterDTO $dto): JsonResponse
    {
        if ($this->userRepository->findOneBy(['email' => $dto->email]) !== null) {
            return new JsonResponse(['error' => 'This email is already registered.'], 409);
        }

        $role = match ($dto->role) {
            'couple' => Role::Couple,
            'vendor' => Role::Vendor,
        };

        $user = new User();
        $user->setEmail($dto->email)
            ->setFirstName($dto->firstName)
            ->setLastName($dto->lastName)
            ->setRoles([$role->value])
            ->setPassword($this->passwordHasher->hashPassword($user, $dto->password));

        $this->em->persist($user);
        $this->em->flush();

        return new JsonResponse([
            'token' => $this->jwtManager->create($user),
            'user'  => [
                'id'        => $user->getId()->toRfc4122(),
                'email'     => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName'  => $user->getLastName(),
                'roles'     => $user->getRoles(),
            ],
        ], 201);
    }
}
