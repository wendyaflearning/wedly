<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use App\DTO\Couple\RegisterRequestDto;
use App\Service\Couple\CoupleRegistrationService;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Last screen of the couple onboarding: it creates the account and opens the
 * session in the same request, so the welcome screen is already authenticated.
 * The JWT travels in the `jwt_token` httpOnly cookie the rest of the platform
 * uses — the frontend never handles the token itself.
 *
 * `\DomainException` and the payload validation are turned into their responses
 * by `ExceptionListener`, which is why nothing is caught here.
 */
#[Route('/api/v1/register', name: 'api_couple_register', methods: ['POST'])]
final readonly class PostRegisterAction
{
    public function __construct(
        private CoupleRegistrationService $registrationService,
        #[Autowire(service: 'lexik_jwt_authentication.handler.authentication_success')]
        private AuthenticationSuccessHandler $authSuccessHandler,
    ) {}

    public function __invoke(#[MapRequestPayload] RegisterRequestDto $dto): JsonResponse
    {
        $user = $this->registrationService->register($dto);

        $response = new JsonResponse([
            'message'   => 'Votre espace du couple est prêt.',
            'firstName' => $user->getFirstName(),
        ], 201);

        foreach ($this->authSuccessHandler->handleAuthenticationSuccess($user)->headers->getCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }
}
