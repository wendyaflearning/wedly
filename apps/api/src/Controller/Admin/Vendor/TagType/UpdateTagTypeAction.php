<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagType;

use App\DTO\Admin\Vendor\TagType\AdminTagTypeResponseDto;
use App\DTO\Admin\Vendor\TagType\UpdateTagTypeRequestDto;
use App\Service\Vendor\AdminTagTypeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route(
    '/api/v1/admin/tag-types/{id}',
    name: 'api_admin_tag_type_update',
    requirements: ['id' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final readonly class UpdateTagTypeAction
{
    public function __construct(private AdminTagTypeService $tagTypeService) {}

    public function __invoke(string $id, #[MapRequestPayload] UpdateTagTypeRequestDto $dto): JsonResponse
    {
        $tagType = $this->tagTypeService->update($id, $dto);

        return new JsonResponse(AdminTagTypeResponseDto::fromEntity($tagType));
    }
}
