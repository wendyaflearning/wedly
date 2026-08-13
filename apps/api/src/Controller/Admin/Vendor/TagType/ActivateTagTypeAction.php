<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagType;

use App\DTO\Admin\Vendor\TagType\AdminTagTypeResponseDto;
use App\Service\Vendor\AdminTagTypeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route(
    '/api/v1/admin/tag-types/{id}/activate',
    name: 'api_admin_tag_type_activate',
    requirements: ['id' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final readonly class ActivateTagTypeAction
{
    public function __construct(private AdminTagTypeService $tagTypeService) {}

    public function __invoke(string $id): JsonResponse
    {
        $tagType = $this->tagTypeService->activate($id);

        return new JsonResponse(AdminTagTypeResponseDto::fromEntity($tagType));
    }
}
