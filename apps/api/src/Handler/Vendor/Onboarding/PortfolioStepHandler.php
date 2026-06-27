<?php

declare(strict_types=1);

namespace App\Handler\Vendor\Onboarding;

use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class PortfolioStepHandler extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface   $em,
        private PortfolioImageRepository $portfolioImageRepository,
        private PortfolioService         $portfolioService,
        ValidatorInterface               $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::Portfolio;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        throw new DomainException(
            'Cette étape utilise un endpoint dédié (/portfolio). Utilisez le bon endpoint.',
            400
        );
    }

    public function getStepData(Vendor $vendor): array
    {
        $images = $this->portfolioImageRepository->findByVendor($vendor);
        if (empty($images)) {
            return [];
        }

        return [
            'images' => array_map(fn(PortfolioImage $image) => [
                'id'         => $image->getId()->toRfc4122(),
                'url'        => $image->getUrl(),
                'is_cover'   => $image->isCover(),
                'sort_order' => $image->getSortOrder(),
            ], $images),
        ];
    }

    public function upload(Vendor $vendor, PortfolioStepRequestDto $dto): void
    {
        $oldImages     = $this->portfolioImageRepository->findByVendor($vendor);
        $existingCover = array_values(
            array_filter($oldImages, fn(PortfolioImage $image) => $image->isCover())
        )[0] ?? null;

        if ($dto->coverPhoto === null && $existingCover === null) {
            throw new DomainException('Une photo de couverture est requise.', 422);
        }

        $oldCoverPublicId = null;
        if ($dto->coverPhoto !== null) {
            $cover = $this->portfolioService->uploadPhoto($vendor, $dto->coverPhoto, 0);
            $cover->setIsCover(true);

            if ($existingCover !== null) {
                $oldCoverPublicId = $existingCover->getCloudinaryPublicId();
                $this->em->remove($existingCover);
            }
        }

        $existingSecondaries = array_filter($oldImages, fn(PortfolioImage $image) => !$image->isCover());
        $maxOrder = empty($existingSecondaries)
            ? 0
            : max(array_map(fn(PortfolioImage $image) => $image->getSortOrder(), $existingSecondaries));

        foreach ($dto->photos as $i => $photo) {
            $this->portfolioService->uploadPhoto($vendor, $photo, $maxOrder + $i + 1);
        }

        $this->em->flush();

        $this->portfolioService->destroyCloudinaryAsset($oldCoverPublicId);

        $persistedImages = $this->portfolioImageRepository->findByVendor($vendor);
        $hasCover        = !empty(array_filter($persistedImages, fn(PortfolioImage $image) => $image->isCover()));
        $secondaryCount  = count(array_filter($persistedImages, fn(PortfolioImage $image) => !$image->isCover()));

        if ($hasCover && $secondaryCount >= 2) {
            $vendor->setOnboardingStep(OnboardingStep::Portfolio);
            $this->em->flush();
        }
    }
}
