<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class PortfolioStepRequestDto implements DTOInterface
{
    public function __construct(
        #[Assert\File(
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            mimeTypesMessage: 'Seuls les formats JPG, PNG et WebP sont acceptés.',
        )]
        public ?UploadedFile $coverPhoto,

        #[Assert\Count(min: 0, max: 9)]
        #[Assert\All([
            new Assert\File(
                mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                mimeTypesMessage: 'Seuls les formats JPG, PNG et WebP sont acceptés.',
            ),
        ])]
        public array $photos,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            coverPhoto: $request->files->get('cover_photo'),
            photos:     $request->files->all('photos') ?? [],
        );
    }

    public static function fromArray(array $data): static
    {
        return new self(
            coverPhoto: $data['cover_photo'] ?? null,
            photos:     $data['photos'] ?? [],
        );
    }
}
