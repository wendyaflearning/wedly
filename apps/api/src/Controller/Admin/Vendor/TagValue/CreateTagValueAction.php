<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\TagValue;

use App\DTO\Admin\Vendor\TagValue\AdminTagValueResponseDto;
use App\DTO\Admin\Vendor\TagValue\CreateTagValueRequestDto;
use App\Service\Vendor\AdminTagValueService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/tag-values', name: 'api_admin_tag_value_create', methods: ['POST'])]
final readonly class CreateTagValueAction
{
    public function __construct(private AdminTagValueService $tagValueService) {}

    public function __invoke(#[MapRequestPayload] CreateTagValueRequestDto $dto): JsonResponse
    {
        $tagValue = $this->tagValueService->create($dto);

        return new JsonResponse(AdminTagValueResponseDto::fromEntity($tagValue), 201);
    }
}
