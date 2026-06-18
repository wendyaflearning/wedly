<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth/logout', name: 'auth_logout', methods: ['POST'])]
final class LogoutAction extends AbstractController
{
    public function __invoke(): Response
    {
        $response = new Response(null, Response::HTTP_NO_CONTENT);

        $response->headers->setCookie(
            Cookie::create('jwt_token')
                ->withValue('')
                ->withExpires(new \DateTimeImmutable('-1 year'))
                ->withPath('/')
                ->withHttpOnly(true)
                ->withSameSite('lax')
                ->withSecure(false)
        );

        return $response;
    }
}
