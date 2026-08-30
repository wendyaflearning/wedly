<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Service\Couple\CoupleRegistrationService;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Single Action Controller, sans AbstractController ni try/catch : les deux
 * voisins de ce dossier font l'inverse, mais c'est la convention transverse du
 * parcours (WED-58) et le ticket la rappelle explicitement.
 *
 * La route est déjà déclarée PUBLIC_ACCESS dans security.yaml — elle attendait
 * son contrôleur.
 */
#[Route('/api/v1/register', name: 'auth_register', methods: ['POST'])]
final readonly class PostRegisterAction
{
    public function __construct(
        private CoupleRegistrationService $registrationService,
        #[Autowire(service: 'lexik_jwt_authentication.handler.authentication_success')]
        private AuthenticationSuccessHandler $authSuccessHandler,
    ) {}

    public function __invoke(#[MapRequestPayload] RegisterCoupleRequestDto $dto): JsonResponse
    {
        $user = $this->registrationService->register($dto);

        // Le prénom est renvoyé pour l'écran de bienvenue : il l'interpole, et
        // le tenir de la réponse évite qu'il dépende d'un store déjà vidé.
        $response = new JsonResponse(['firstName' => $user->getFirstName()], 201);

        // Même mécanique que PostResetPasswordAction : Lexik pose le cookie
        // httpOnly sur sa propre réponse, on le recopie sur la nôtre.
        foreach ($this->authSuccessHandler->handleAuthenticationSuccess($user)->headers->getCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }
}
