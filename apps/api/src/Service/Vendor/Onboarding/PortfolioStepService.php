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

    public function upload(Vendor $vendor, PortfolioStepRequestDto $dto): void
    {
        $oldImages    = $this->portfolioImageRepository->findByVendor($vendor);
        $oldPublicIds = array_values(array_filter(
            array_map(fn(PortfolioImage $img) => $img->getCloudinaryPublicId(), $oldImages),
        ));

        $newCount = 1 + count($dto->photos);

        // TODO Year 2 : limite par type de prestataire (photographe/vidéaste = 10, autres = 5)
        if ($newCount > 10) {
            throw new DomainException(
                sprintf('Limite dépassée : impossible d\'uploader %d photo(s).', $newCount),
                422,
            );
        }

        $coverResult = $this->cloudinaryUpload($dto->coverPhoto->getPathname(), (string) $vendor->getId());

        // ⚠️ TODO Year 2 : si un upload échoue ici, les uploads précédents sont des orphelins
        // Cloudinary. Nettoyer via cloudinary_public_id avec un job de réconciliation.
        $additionalResults = [];
        foreach ($dto->photos as $photo) {
            $additionalResults[] = $this->cloudinaryUpload($photo->getPathname(), (string) $vendor->getId());
        }

        foreach ($oldImages as $img) {
            $this->em->remove($img);
        }
        $this->em->flush();

        $coverImage = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl($coverResult['secure_url'])
            ->setCloudinaryPublicId($coverResult['public_id'])
            ->setIsCover(true)
            ->setSortOrder(0);
        $this->em->persist($coverImage);

        foreach ($additionalResults as $i => $result) {
            $image = (new PortfolioImage())
                ->setVendor($vendor)
                ->setUrl($result['secure_url'])
                ->setCloudinaryPublicId($result['public_id'])
                ->setIsCover(false)
                ->setSortOrder($i + 1);
            $this->em->persist($image);
        }
        $this->em->flush();

        foreach ($oldPublicIds as $publicId) {
            try {
                $this->cloudinary->uploadApi()->destroy($publicId);
            } catch (\Throwable $e) {
                $this->logger->warning('Cloudinary destroy failed', [
                    'public_id' => $publicId,
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
