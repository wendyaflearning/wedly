<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\Portfolio;

use App\Exception\ValidationException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;

final readonly class AdminPortfolioUploadRequestDto
{
    public function __construct(
        public UploadedFile $file,
        public ?int $sortOrder,
        public array $styleTags,
        public array $specialtyTags,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $file = $request->files->get('photo');
        if (!$file instanceof UploadedFile) {
            throw new ValidationException([[
                'field'   => 'photo',
                'message' => 'Le champ "photo" est requis.',
            ]]);
        }

        $sortOrder = $request->request->get('sortOrder');

        return new self(
            file:          $file,
            sortOrder:     ($sortOrder !== null && $sortOrder !== '') ? (int) $sortOrder : null,
            styleTags:     $request->request->all('styleTags'),
            specialtyTags: $request->request->all('specialtyTags'),
        );
    }
}
