<?php

declare(strict_types=1);

namespace App\Controller\Service;

use App\DTO\Service\TagTypeResponseDto;
use App\Entity\Vendor\TagType;
use App\Repository\Vendor\ServiceRepository;
use App\Repository\Vendor\TagTypeRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetServiceTagTypesAction
{
    public function __construct(
        private ServiceRepository $serviceRepository,
        private TagTypeRepository $tagTypeRepository,
    ) {}

    #[Route(
        '/api/v1/services/{serviceId}/tag-types',
        name: 'api_service_tag_types_list',
        requirements: ['serviceId' => '[0-9a-fA-F-]{36}'],
        methods: ['GET'],
    )]
    public function __invoke(string $serviceId): JsonResponse
    {
        if ($this->serviceRepository->find($serviceId) === null) {
            return new JsonResponse(['error' => 'Service introuvable.'], 404);
        }

        $tagTypes = array_map(
            fn(TagType $tagType) => TagTypeResponseDto::fromEntity($tagType),
            $this->tagTypeRepository->findActiveByServiceIdWithValues($serviceId),
        );

        return new JsonResponse($tagTypes);
    }
}
