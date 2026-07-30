<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\Portfolio;

use App\DTO\Admin\Vendor\Portfolio\PatchVendorPortfolioTagsRequestDto;
use App\Entity\Vendor\Specialty;
use App\Entity\Wedding\WeddingStyle;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route(
    '/api/v1/admin/vendors/{vendorId}/portfolio/{imageId}/tags',
    name: 'api_admin_vendor_portfolio_tags_patch',
    requirements: ['vendorId' => '[0-9a-fA-F-]{36}', 'imageId' => '[0-9a-fA-F-]{36}'],
    methods: ['PATCH'],
)]
final readonly class PatchVendorPortfolioTagsAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private PortfolioImageRepository $portfolioImageRepository,
        private PortfolioService $portfolioService,
        private EntityManagerInterface $em,
    ) {}

    public function __invoke(string $vendorId, string $imageId, #[MapRequestPayload] PatchVendorPortfolioTagsRequestDto $dto): JsonResponse
    {
        $vendor = $this->vendorRepository->find($vendorId);

        if (null === $vendor) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        $image = $this->portfolioImageRepository->findOneBy([
            'id'     => $imageId,
            'vendor' => $vendor,
        ]);

        if (null === $image) {
            return new JsonResponse(['error' => 'Image introuvable.'], 404);
        }

        $this->portfolioService->updateTags($vendor, $image, $dto->styleIds, $dto->specialtyIds);
        $this->em->flush();

        return new JsonResponse([
            'id'          => $image->getId()->toRfc4122(),
            'url'         => $image->getUrl(),
            'isCover'     => $image->isCover(),
            'styles'      => $this->tags($image->getStyles()->toArray()),
            'specialties' => $this->tags($image->getSpecialties()->toArray()),
        ], 200);
    }

    private function tags(array $tags): array
    {
        return array_map(
            fn(WeddingStyle|Specialty $tag) => [
                'id'   => $tag->getId()->toRfc4122(),
                'name' => $tag->getName(),
                'slug' => $tag->getSlug(),
            ],
            $tags
        );
    }
}
