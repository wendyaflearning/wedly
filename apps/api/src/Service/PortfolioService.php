<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorAutoTaggedService;
use App\Entity\Wedding\WeddingStyle;
use App\Exception\ValidationException;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\SpecialtyRepository;
use App\Repository\Vendor\TagValueRepository;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
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
        private readonly TagValueRepository $tagValueRepository,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
    ) {}

    public function uploadPhoto(
        Vendor $vendor,
        UploadedFile $file,
        ?int $sortOrder = null,
        array $styleTags = [],
        array $specialtyTags = [],
    ): PortfolioImage {
        // Résolution conservée pour la validation + l'auto-tagging du service vendeur (VendorAutoTaggedService).
        $this->resolveSpecialtyTags($vendor, $specialtyTags);
        $this->resolveStyleTags($styleTags);

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

        // $specialties/$styles ne sont plus attachées à $image depuis la suppression de
        // portfolio_image_specialty/portfolio_image_style (WED-97). Le tagging réel de la photo
        // se fait désormais via PortfolioService::updatePortfolioTags() (TagValue), pas à l'upload.

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
            if ($specialty === null) {
                throw new ValidationException([[
                    'field'   => 'specialtyTags',
                    'message' => sprintf('La spécialité "%s" est invalide ou ne correspond à aucun service de ce prestataire.', $tag),
                ]]);
            }

            $service = $specialty->getService();
            if (!$vendor->getServices()->contains($service)) {
                $vendor->addService($service);
                $this->em->persist(new VendorAutoTaggedService($vendor, $service));
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
     * @param string[] $tagValueIds
     */
    public function updatePortfolioTags(PortfolioImage $image, array $tagValueIds): void
    {
        $tagValues = $this->resolveTagValues(array_unique($tagValueIds));

        $this->assertMaxSelectionsRespected($tagValues);

        $image->getTags()->clear();
        foreach ($tagValues as $tagValue) {
            $image->addTag($tagValue);
        }

        $image->setVisibleInWedream($this->hasPrimaryTagValue($tagValues));
    }

    /**
     * @param string[] $tagValueIds
     *
     * @return TagValue[]
     */
    private function resolveTagValues(array $tagValueIds): array
    {
        $tagValues = [];
        foreach ($tagValueIds as $tagValueId) {
            $tagValue = $this->tagValueRepository->find($tagValueId);
            if ($tagValue === null || !$tagValue->isActive()) {
                throw new ValidationException([[
                    'field'   => 'tagValueIds',
                    'message' => sprintf('La valeur de tag "%s" est invalide ou inactive.', $tagValueId),
                ]]);
            }

            $tagValues[] = $tagValue;
        }

        return $tagValues;
    }

    /**
     * @param TagValue[] $tagValues
     */
    private function assertMaxSelectionsRespected(array $tagValues): void
    {
        $tagTypesById  = [];
        $countByTagType = [];

        foreach ($tagValues as $tagValue) {
            $tagType   = $tagValue->getTagType();
            $tagTypeId = (string) $tagType->getId();

            $tagTypesById[$tagTypeId]   ??= $tagType;
            $countByTagType[$tagTypeId] = ($countByTagType[$tagTypeId] ?? 0) + 1;
        }

        foreach ($countByTagType as $tagTypeId => $count) {
            /** @var TagType $tagType */
            $tagType       = $tagTypesById[$tagTypeId];
            $maxSelections = $tagType->getMaxSelections();

            if ($maxSelections !== null && $count > $maxSelections) {
                throw new ValidationException([[
                    'field'   => 'tagValueIds',
                    'message' => sprintf(
                        'Vous ne pouvez pas sélectionner plus de %d valeur(s) pour "%s".',
                        $maxSelections,
                        $tagType->getLabel(),
                    ),
                ]]);
            }
        }
    }

    /**
     * @param TagValue[] $tagValues
     */
    private function hasPrimaryTagValue(array $tagValues): bool
    {
        foreach ($tagValues as $tagValue) {
            if ($tagValue->getTagType()->isPrimary()) {
                return true;
            }
        }

        return false;
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

    /**
     * Staging and prod share one Cloudinary account (CLOUDINARY_CLOUD_NAME):
     * namespacing by environment keeps staging test uploads out of prod's
     * folders. Prod keeps its existing, unprefixed path so already-uploaded
     * images (referenced by the public_id stored on PortfolioImage) don't move.
     */
    private function cloudinaryFolder(string $vendorId): string
    {
        $namespace = $this->environment === 'prod' ? 'wedly' : sprintf('wedly-%s', $this->environment);

        return sprintf('%s/vendors/%s', $namespace, $vendorId);
    }

    private function cloudinaryUpload(string $filePath, string $vendorId): array
    {
        try {
            return (array) $this->cloudinary->uploadApi()->upload($filePath, [
                'folder'       => $this->cloudinaryFolder($vendorId),
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
