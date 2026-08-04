<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Admin\Vendor\Portfolio;

use App\DTO\Admin\Vendor\Portfolio\AdminPortfolioUploadRequestDto;
use App\Exception\ValidationException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;

final class AdminPortfolioUploadRequestDtoTest extends TestCase
{
    public function test_from_request_parses_file_sort_order_and_tags(): void
    {
        $file = $this->createStub(UploadedFile::class);

        $request = new Request(
            request: [
                'sortOrder'     => '3',
                'styleTags'     => ['style-1', 'style-2'],
                'specialtyTags' => ['specialty-1'],
            ],
            files: ['photo' => $file],
        );

        $dto = AdminPortfolioUploadRequestDto::fromRequest($request);

        $this->assertSame($file, $dto->file);
        $this->assertSame(3, $dto->sortOrder);
        $this->assertSame(['style-1', 'style-2'], $dto->styleTags);
        $this->assertSame(['specialty-1'], $dto->specialtyTags);
    }

    public function test_from_request_defaults_sort_order_and_tags_when_absent(): void
    {
        $file    = $this->createStub(UploadedFile::class);
        $request = new Request(files: ['photo' => $file]);

        $dto = AdminPortfolioUploadRequestDto::fromRequest($request);

        $this->assertNull($dto->sortOrder);
        $this->assertSame([], $dto->styleTags);
        $this->assertSame([], $dto->specialtyTags);
    }

    public function test_from_request_throws_422_when_photo_is_missing(): void
    {
        $this->expectException(ValidationException::class);

        AdminPortfolioUploadRequestDto::fromRequest(new Request());
    }
}
