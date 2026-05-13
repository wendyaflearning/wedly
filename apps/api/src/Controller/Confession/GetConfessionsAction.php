<?php

declare(strict_types=1);

namespace App\Controller\Confession;

use App\DTO\Confession\ConfessionResponseDto;
use App\Entity\Confession\Confession;
use App\Repository\Confession\ConfessionRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetConfessionsAction
{
    public function __construct(
        private ConfessionRepository $confessionRepository,
    ) {}

    #[Route('/api/v1/confessions', name: 'api_confessions_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $confessions = array_map(
            fn(Confession $confession) => new ConfessionResponseDto($confession),
            $this->confessionRepository->findAll()
        );

        return new JsonResponse($confessions);
    }
}
