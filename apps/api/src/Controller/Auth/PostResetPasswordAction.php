<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\Entity\User\PasswordResetToken;
use App\Enum\User\PasswordResetTokenStatus;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth/reset-password', name: 'auth_reset_password', methods: ['POST'])]
final class PostResetPasswordAction extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        #[Autowire(service: 'lexik_jwt_authentication.handler.authentication_success')]
        private readonly AuthenticationSuccessHandler $authSuccessHandler,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data            = json_decode($request->getContent(), true);
        $rawToken        = $data['token'] ?? '';
        $password        = $data['password'] ?? '';
        $passwordConfirm = $data['passwordConfirm'] ?? '';

        $hash = hash('sha256', $rawToken);

        /** @var PasswordResetToken|null $resetToken */
        $resetToken = $this->em->getRepository(PasswordResetToken::class)->findOneBy(['token' => $hash]);

        if ($resetToken === null) {
            return new JsonResponse(['error' => 'Lien invalide ou expiré.'], 400);
        }

        if ($resetToken->getStatus() !== PasswordResetTokenStatus::Pending) {
            return new JsonResponse(['error' => 'Lien invalide ou expiré.'], 400);
        }

        if ($resetToken->getExpiresAt() <= new \DateTimeImmutable()) {
            return new JsonResponse(['error' => 'Lien invalide ou expiré.'], 400);
        }

        if ($password !== $passwordConfirm) {
            return new JsonResponse(['error' => 'Les mots de passe ne correspondent pas.'], 422);
        }

        if (strlen($password) < 8) {
            return new JsonResponse(['error' => 'Le mot de passe doit contenir au moins 8 caractères.'], 422);
        }

        $user = $resetToken->getUser();

        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $resetToken->setStatus(PasswordResetTokenStatus::Used);

        $this->em->flush();

        $lexikResponse = $this->authSuccessHandler->handleAuthenticationSuccess($user);
        $response      = new JsonResponse(['message' => 'Mot de passe mis à jour.']);

        foreach ($lexikResponse->headers->getCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }
}
