<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\Entity\User\PasswordResetToken;
use App\Enum\User\PasswordResetTokenStatus;
use App\Repository\User\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth/forgot-password', name: 'auth_forgot_password', methods: ['POST'])]
final class PostForgotPasswordAction extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data  = json_decode($request->getContent(), true);
        $email = trim($data['email'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Adresse email invalide.'], 422);
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);

        if ($user !== null) {
            $rawToken  = bin2hex(random_bytes(32));
            $hash      = hash('sha256', $rawToken);
            $expiresAt = new \DateTimeImmutable('+1 hour');

            $resetToken = (new PasswordResetToken())
                ->setToken($hash)
                ->setStatus(PasswordResetTokenStatus::Pending)
                ->setExpiresAt($expiresAt)
                ->setUser($user);

            $this->em->persist($resetToken);
            $this->em->flush();

            $resetLink = $this->frontendUrl . '/reset-password?token=' . $rawToken;

            $mail = (new TemplatedEmail())
                ->from(new Address('contact@wedly-apps.com', 'Wedly'))
                ->to(new Address($user->getEmail(), $user->getFirstName()))
                ->subject('Réinitialisez votre mot de passe Wedly')
                ->htmlTemplate('emails/reset_password.html.twig')
                ->context([
                    'firstName' => $user->getFirstName(),
                    'resetLink' => $resetLink,
                ]);

            $this->mailer->send($mail);
        }

        return new JsonResponse([
            'message' => 'Si cette adresse est associée à un compte, vous recevrez un lien dans quelques instants.',
        ]);
    }
}
