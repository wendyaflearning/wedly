<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class PortfolioService
{
    public function __construct(
        private readonly Cloudinary $cloudinary,
        private readonly EntityManagerInterface $em,
        private readonly PortfolioImageRepository $portfolioImageRepository,
        private readonly LoggerInterface $logger,
    ) {}

    public function uploadPhoto(Vendor $vendor, UploadedFile $file, ?int $sortOrder = null): PortfolioImage
    {
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

        $this->em->persist($image);

        return $image;
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
