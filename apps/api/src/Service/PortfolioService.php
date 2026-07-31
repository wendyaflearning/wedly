<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;
use App\Exception\ValidationException;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\SpecialtyRepository;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class PortfolioService
{
    private const MAX_SPECIALTY_TAGS = 2;

    public function __construct(
        private readonly Cloudinary $cloudinary,
        private readonly EntityManagerInterface $em,
        private readonly PortfolioImageRepository $portfolioImageRepository,
        private readonly LoggerInterface $logger,
        private readonly SpecialtyRepository $specialtyRepository,
    ) {}

    public function uploadPhoto(
        Vendor $vendor,
        UploadedFile $file,
        ?int $sortOrder = null,
        array $styleTags = [],
        array $specialtyTags = [],
    ): PortfolioImage {
        $specialties = $this->resolveSpecialtyTags($vendor, $specialtyTags);
        $styles      = $this->resolveStyleTags($styleTags);

        $result = $this->cloudinaryUpload($file->getPathname(), (string) $vendor->getId());

        $images            = $this->portfolioImageRepository->findByVendor($vendor);
        $resolvedSortOrder = $sortOrder ?? (
            empty($images) ? 0 : max(array_map(fn(PortfolioImage $image) => $image->getSortOrder(), $images)) + 1
        );

        $image = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl($result['secure_url'])
            ->setCloudinaryPublicId($result['public_id'])
            ->setIsCover(false)
            ->setSortOrder($resolvedSortOrder);

        foreach ($specialties as $specialty) {
            $image->addSpecialty($specialty);
        }

        foreach ($styles as $style) {
            $image->addStyle($style);
        }

        $this->em->persist($image);

        return $image;
    }

    /**
     * @param string[] $specialtyTags
     *
     * @return Specialty[]
     */
    private function resolveSpecialtyTags(Vendor $vendor, array $specialtyTags): array
    {
        if (count($specialtyTags) > self::MAX_SPECIALTY_TAGS) {
            throw new ValidationException([[
                'field'   => 'specialtyTags',
                'message' => sprintf('Vous ne pouvez pas associer plus de %d spécialités à une photo.', self::MAX_SPECIALTY_TAGS),
            ]]);
        }

        $specialties = [];
        foreach ($specialtyTags as $tag) {
            $specialty = $this->specialtyRepository->find($tag);
            if ($specialty === null || !$vendor->getServices()->contains($specialty->getService())) {
                throw new ValidationException([[
                    'field'   => 'specialtyTags',
                    'message' => sprintf('La spécialité "%s" est invalide ou ne correspond à aucun service de ce prestataire.', $tag),
                ]]);
            }
            $specialties[] = $specialty;
        }

        return $specialties;
    }

    /**
     * @param string[] $styleTags
     *
     * @return WeddingStyle[]
     */
    private function resolveStyleTags(array $styleTags): array
    {
        $styles = [];
        foreach ($styleTags as $tag) {
            $style = $this->em->getRepository(WeddingStyle::class)->find($tag);
            if ($style === null) {
                throw new ValidationException([[
                    'field'   => 'styleTags',
                    'message' => sprintf('Le style "%s" est invalide.', $tag),
                ]]);
            }
            $styles[] = $style;
        }

        return $styles;
    }

    /**
     * @param string[]|null $styleIds
     * @param string[]|null $specialtyIds
     */
    public function updateTags(Vendor $vendor, PortfolioImage $image, ?array $styleIds, ?array $specialtyIds): void
    {
        if ($specialtyIds !== null && count($specialtyIds) === 0) {
            throw new ValidationException([[
                'field'   => 'specialtyIds',
                'message' => 'Vous devez sélectionner au moins une spécialité.',
            ]]);
        }

        if ($specialtyIds !== null) {
            $specialties = $this->resolveSpecialtyTags($vendor, $specialtyIds);
            foreach ($image->getSpecialties()->toArray() as $specialty) {
                $image->removeSpecialty($specialty);
            }
            foreach ($specialties as $specialty) {
                $image->addSpecialty($specialty);
            }
        }

        if ($styleIds !== null) {
            $styles = $this->resolveStyleTags($styleIds);
            foreach ($image->getStyles()->toArray() as $style) {
                $image->removeStyle($style);
            }
            foreach ($styles as $style) {
                $image->addStyle($style);
            }
        }
    }

    public function deletePhoto(PortfolioImage $image): ?string
    {
        $publicId = $image->getCloudinaryPublicId();
        $this->em->remove($image);

        return $publicId;
    }

    public function destroyCloudinaryAsset(?string $publicId): void
    {
        if ($publicId === null) {
            return;
        }

        try {
            $this->cloudinary->uploadApi()->destroy($publicId);
        } catch (\Throwable $e) {
            $this->logger->warning('Cloudinary destroy failed', [
                'public_id' => $publicId,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    public function setCover(PortfolioImage $image, Vendor $vendor): void
    {
        foreach ($this->portfolioImageRepository->findByVendor($vendor) as $img) {
            $img->setIsCover(false);
        }

        $image->setIsCover(true);
    }

    private function cloudinaryUpload(string $filePath, string $vendorId): array
    {
        try {
            return (array) $this->cloudinary->uploadApi()->upload($filePath, [
                'folder'       => 'wedly/vendors/' . $vendorId,
                'quality'      => 'auto:good',
                'fetch_format' => 'auto',
                'width'        => 2500,
                'crop'         => 'limit',
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
