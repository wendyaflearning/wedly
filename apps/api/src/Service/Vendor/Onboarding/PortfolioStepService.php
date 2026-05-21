<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Repository\Vendor\PortfolioImageRepository;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Psr\Log\LoggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class PortfolioStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        private Cloudinary $cloudinary,
        private PortfolioImageRepository $portfolioImageRepository,
        private LoggerInterface $logger,
        ValidatorInterface $validator,
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
            'images' => array_map(fn(PortfolioImage $img) => [
                'id'         => $img->getId()->toRfc4122(),
                'url'        => $img->getUrl(),
                'is_cover'   => $img->isCover(),
                'sort_order' => $img->getSortOrder(),
            ], $images),
        ];
    }

    public function upload(Vendor $vendor, PortfolioStepRequestDto $dto): void
    {
        $oldImages     = $this->portfolioImageRepository->findByVendor($vendor);
        $existingCover = array_values(array_filter($oldImages, fn(PortfolioImage $img) => $img->isCover()))[0] ?? null;

        if ($dto->coverPhoto === null && $existingCover === null) {
            throw new DomainException('Une photo de couverture est requise.', 422);
        }

        // Upload new files first — fail fast before any DB change
        // ⚠️ TODO Year 2 : si un upload échoue ici, les uploads précédents sont des orphelins Cloudinary.
        $coverResult = $dto->coverPhoto !== null
            ? $this->cloudinaryUpload($dto->coverPhoto->getPathname(), (string) $vendor->getId())
            : null;

        $additionalResults = [];
        foreach ($dto->photos as $photo) {
            $additionalResults[] = $this->cloudinaryUpload($photo->getPathname(), (string) $vendor->getId());
        }

        $oldCoverPublicId = null;

        if ($coverResult !== null && $existingCover !== null) {
            $oldCoverPublicId = $existingCover->getCloudinaryPublicId();
            $this->em->remove($existingCover);
        }

        if ($coverResult !== null) {
            $this->em->persist(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl($coverResult['secure_url'])
                    ->setCloudinaryPublicId($coverResult['public_id'])
                    ->setIsCover(true)
                    ->setSortOrder(0)
            );
        }

        $existingSecondaries  = array_filter($oldImages, fn(PortfolioImage $img) => !$img->isCover());

        $maxExistingSortOrder  = empty($existingSecondaries)
            ? 0
            : max(array_map(fn(PortfolioImage $img) => $img->getSortOrder(), $existingSecondaries));

        foreach ($additionalResults as $i => $result) {
            $this->em->persist(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl($result['secure_url'])
                    ->setCloudinaryPublicId($result['public_id'])
                    ->setIsCover(false)
                    ->setSortOrder($maxExistingSortOrder + $i + 1)
            );
        }

        $this->em->flush();

        $persistedImages  = $this->portfolioImageRepository->findByVendor($vendor);
        $hasCover         = !empty(array_filter($persistedImages, fn(PortfolioImage $img) => $img->isCover()));
        $secondaryCount   = count(array_filter($persistedImages, fn(PortfolioImage $img) => !$img->isCover()));

        if ($hasCover && $secondaryCount >= 4) {
            $vendor->setOnboardingStep(OnboardingStep::Portfolio);
            $this->em->flush();
        }

        if ($oldCoverPublicId !== null) {
            try {
                $this->cloudinary->uploadApi()->destroy($oldCoverPublicId);
            } catch (\Throwable $e) {
                $this->logger->warning('Cloudinary destroy failed', [
                    'public_id' => $oldCoverPublicId,
                    'error'     => $e->getMessage(),
                ]);
            }
        }
    }

    private function cloudinaryUpload(string $filePath, string $vendorId): array
    {
        try {
            return (array) $this->cloudinary->uploadApi()->upload($filePath, [
                'folder' => 'wedly/vendors/' . $vendorId,
            ]);
        } catch (\Throwable $e) {
            throw new DomainException(
                sprintf('Échec de l\'upload Cloudinary : %s', $e->getMessage()),
                500,
                $e,
            );
        }
    }
}
