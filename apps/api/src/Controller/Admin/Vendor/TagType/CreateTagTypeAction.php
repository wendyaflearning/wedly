<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagType;

use App\DTO\Admin\Vendor\TagType\AdminTagTypeResponseDto;
use App\DTO\Admin\Vendor\TagType\CreateTagTypeRequestDto;
use App\Service\Vendor\AdminTagTypeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/tag-types', name: 'api_admin_tag_type_create', methods: ['POST'])]
final readonly class CreateTagTypeAction
{
    public function __construct(private AdminTagTypeService $tagTypeService) {}

    public function __invoke(#[MapRequestPayload] CreateTagTypeRequestDto $dto): JsonResponse
    {
        $tagType = $this->tagTypeService->create($dto);

        return new JsonResponse(AdminTagTypeResponseDto::fromEntity($tagType), 201);
    }
}
