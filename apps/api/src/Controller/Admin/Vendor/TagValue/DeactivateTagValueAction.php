<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagValue;

use App\DTO\Admin\Vendor\TagValue\AdminTagValueResponseDto;
use App\Service\Vendor\AdminTagValueService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route(
    '/api/v1/admin/tag-values/{id}/deactivate',
    name: 'api_admin_tag_value_deactivate',
    requirements: ['id' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final readonly class DeactivateTagValueAction
{
    public function __construct(private AdminTagValueService $tagValueService) {}

    public function __invoke(string $id): JsonResponse
    {
        $tagValue = $this->tagValueService->deactivate($id);

        return new JsonResponse(AdminTagValueResponseDto::fromEntity($tagValue));
    }
}
