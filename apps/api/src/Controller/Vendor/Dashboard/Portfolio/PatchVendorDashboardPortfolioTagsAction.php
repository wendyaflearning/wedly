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
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route(
    '/api/v1/vendors/me/portfolio/{imageId}/tags',
    name: 'api_vendor_dashboard_portfolio_tags_patch',
    requirements: ['imageId' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final readonly class PatchVendorDashboardPortfolioTagsAction
{
    public function __construct(
        private Security $security,
        private VendorOwnershipResolver $vendorOwnershipResolver,
        private PortfolioImageRepository $portfolioImageRepository,
        private PortfolioService $portfolioService,
        private EntityManagerInterface $em,
    ) {}

    public function __invoke(string $imageId, #[MapRequestPayload] PatchPortfolioTagsRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

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
