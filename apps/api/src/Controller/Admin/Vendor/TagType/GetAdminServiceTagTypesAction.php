<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagType;

use App\DTO\Admin\Vendor\TagType\AdminTagTypeWithValuesResponseDto;
use App\Entity\Vendor\TagType;
use App\Service\Vendor\AdminTagTypeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route(
    '/api/v1/admin/services/{serviceId}/tag-types',
    name: 'api_admin_service_tag_types_list',
    requirements: ['serviceId' => '[0-9a-fA-F-]{36}'],
    methods: ['GET'],
)]
final readonly class GetAdminServiceTagTypesAction
{
    public function __construct(private AdminTagTypeService $tagTypeService) {}

    public function __invoke(string $serviceId): JsonResponse
    {
        $tagTypes = array_map(
            fn(TagType $tagType) => AdminTagTypeWithValuesResponseDto::fromEntity($tagType),
            $this->tagTypeService->listWithValues($serviceId),
        );

        return new JsonResponse($tagTypes);
    }
}
