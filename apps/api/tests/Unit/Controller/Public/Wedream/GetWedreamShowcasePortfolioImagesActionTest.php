<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Public\Wedream;

use App\Controller\Public\Wedream\GetWedreamShowcasePortfolioImagesAction;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\ValueObject\CursorPagination;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Uid\UuidV7;

final class GetWedreamShowcasePortfolioImagesActionTest extends TestCase
{
    private const VENDOR_ID = '0198a1c0-0000-7000-8000-0000000000bb';

    public function test_invoke_asks_the_repository_for_the_requested_limit(): void
    {
        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->once())
            ->method('findWedreamShowcase')
            ->with(6)
            ->willReturn([]);

        $response = $this->action($imageRepository)(new CursorPagination(6));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['items' => []], $this->payload($response));
    }

    public function test_invoke_never_exposes_vendor_identity(): void
    {
        $imageRepository = $this->createStub(PortfolioImageRepository::class);
        $imageRepository->method('findWedreamShowcase')->willReturn([
            $this->image('0198a1c0-0000-7000-8000-000000000002', 'https://cdn/2.jpg'),
        ]);

        $response = $this->action($imageRepository)(new CursorPagination(6));
        $item = $this->payload($response)['items'][0];

        $this->assertSame(['id', 'url', 'tagsByGroup', 'vendorId'], array_keys($item));
        $this->assertSame(self::VENDOR_ID, $item['vendorId']);
        $this->assertStringNotContainsString('Studio Lumiere', (string) $response->getContent());
    }

    private function action(PortfolioImageRepository $imageRepository): GetWedreamShowcasePortfolioImagesAction
    {
        return new GetWedreamShowcasePortfolioImagesAction($imageRepository);
    }

    private function image(string $id, string $url): PortfolioImage
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumiere');

        $vendorId = new \ReflectionProperty(Vendor::class, 'id');
        $vendorId->setValue($vendor, UuidV7::fromString(self::VENDOR_ID));

        $image = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl($url)
            ->setSortOrder(0)
            ->setVisibleInWedream(true);

        $reflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $reflection->setValue($image, UuidV7::fromString($id));

        $image->addTag((new TagValue())->setLabel('Bohème')->setTagType((new TagType())->setLabel('Sous-style')));

        return $image;
    }

    /** @return array<string, mixed> */
    private function payload(JsonResponse $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
