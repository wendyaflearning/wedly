<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\DTO\Service\TagValueResponseDto;
use App\DTO\Vendor\Portfolio\PatchPortfolioTagsRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route(
    '/api/v1/vendors/{id}/portfolio/{imageId}/tags',
    name: 'api_vendor_dashboard_portfolio_tags_patch',
    requirements: ['id' => '[0-9a-fA-F-]{36}', 'imageId' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final class PatchVendorDashboardPortfolioTagsAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly PortfolioImageRepository $portfolioImageRepository,
        private readonly PortfolioService $portfolioService,
        private readonly EntityManagerInterface $em,
    ) {}

    public function __invoke(string $id, string $imageId, #[MapRequestPayload] PatchPortfolioTagsRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        if ($vendor->getId()->toRfc4122() !== $id) {
            return new JsonResponse(['error' => 'Accès interdit.'], 403);
        }

        $image = $this->portfolioImageRepository->findOneBy([
            'id'     => $imageId,
            'vendor' => $vendor,
        ]);

        if ($image === null) {
            return new JsonResponse(['error' => 'Image introuvable.'], 404);
        }

        $this->portfolioService->updatePortfolioTags($image, $dto->tagValueIds);
        $this->em->flush();

        return new JsonResponse([
            'id'                 => $image->getId()->toRfc4122(),
            'url'                => $image->getUrl(),
            'isCover'            => $image->isCover(),
            'isVisibleInWedream' => $image->isVisibleInWedream(),
            'tags'               => array_map(
                static fn(TagValue $tag) => TagValueResponseDto::fromEntity($tag),
                $image->getTags()->toArray(),
            ),
        ], 200);
    }
}
