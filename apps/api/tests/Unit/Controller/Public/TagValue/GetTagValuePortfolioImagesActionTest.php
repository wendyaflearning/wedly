<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Public\TagValue;

use App\Controller\Public\TagValue\GetTagValuePortfolioImagesAction;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\TagValueRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Uid\UuidV7;

final class GetTagValuePortfolioImagesActionTest extends TestCase
{
    private const TAG_VALUE_ID = '0198a1c0-0000-7000-8000-0000000000ff';

    public function test_invoke_returns_404_when_tag_value_is_unknown(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn(null);

        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->never())->method('findPublicByTagValue');

        $response = $this->action($tagValueRepository, $imageRepository)(self::TAG_VALUE_ID, new Request());

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(['error' => 'Sous-style introuvable.'], $this->payload($response));
    }

    public function test_invoke_returns_404_when_tag_value_is_inactive(): void
    {
        $tagValue = (new TagValue())->setLabel('Bohème')->setIsActive(false);

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);

        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->never())->method('findPublicByTagValue');

        $response = $this->action($tagValueRepository, $imageRepository)(self::TAG_VALUE_ID, new Request());

        $this->assertSame(404, $response->getStatusCode());
    }

    public function test_invoke_returns_400_when_cursor_is_not_a_uuid_v7(): void
    {
        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->never())->method('findPublicByTagValue');

        $request  = new Request(['cursor' => '11111111-1111-4111-8111-111111111111']);
        $response = $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, $request);

        $this->assertSame(400, $response->getStatusCode());
        $this->assertSame(['error' => 'Curseur invalide.'], $this->payload($response));
    }

    public function test_invoke_defaults_to_24_and_asks_one_extra_row(): void
    {
        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->once())
            ->method('findPublicByTagValue')
            ->with($this->anything(), null, 25)
            ->willReturn([]);
        $imageRepository->method('countByTagValue')->willReturn(0);

        $response = $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, new Request());

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            ['items' => [], 'nextCursor' => null, 'total' => 0],
            $this->payload($response),
        );
    }

    /**
     * @return iterable<string, array{int|string, int}>
     */
    public static function limitProvider(): iterable
    {
        yield 'above the ceiling'   => [120, 49];
        yield 'at the ceiling'      => [48, 49];
        yield 'below the floor'     => [0, 2];
        yield 'negative'            => [-5, 2];
        yield 'not a number'        => ['abc', 25];
        yield 'empty string'        => ['', 25];
        yield 'within bounds'       => [10, 11];
    }

    #[DataProvider('limitProvider')]
    public function test_invoke_clamps_limit_between_1_and_48(int|string $requested, int $expectedFetch): void
    {
        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->once())
            ->method('findPublicByTagValue')
            ->with($this->anything(), null, $expectedFetch)
            ->willReturn([]);
        $imageRepository->method('countByTagValue')->willReturn(0);

        $request = new Request(['limit' => $requested]);

        $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, $request);
    }

    public function test_invoke_drops_the_extra_row_and_exposes_next_cursor(): void
    {
        $images = [
            $this->image('0198a1c0-0000-7000-8000-000000000003', 'https://cdn/3.jpg'),
            $this->image('0198a1c0-0000-7000-8000-000000000002', 'https://cdn/2.jpg'),
            $this->image('0198a1c0-0000-7000-8000-000000000001', 'https://cdn/1.jpg'),
        ];

        $imageRepository = $this->createStub(PortfolioImageRepository::class);
        $imageRepository->method('findPublicByTagValue')->willReturn($images);
        $imageRepository->method('countByTagValue')->willReturn(42);

        $request  = new Request(['limit' => 2]);
        $response = $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, $request);
        $payload  = $this->payload($response);

        $this->assertCount(2, $payload['items']);
        $this->assertSame('0198a1c0-0000-7000-8000-000000000003', $payload['items'][0]['id']);
        $this->assertSame('0198a1c0-0000-7000-8000-000000000002', $payload['items'][1]['id']);
        $this->assertSame('0198a1c0-0000-7000-8000-000000000002', $payload['nextCursor']);
        $this->assertSame(42, $payload['total']);
    }

    public function test_invoke_returns_null_next_cursor_on_the_last_page(): void
    {
        $imageRepository = $this->createStub(PortfolioImageRepository::class);
        $imageRepository->method('findPublicByTagValue')->willReturn([
            $this->image('0198a1c0-0000-7000-8000-000000000002', 'https://cdn/2.jpg'),
        ]);
        $imageRepository->method('countByTagValue')->willReturn(1);

        $request  = new Request(['limit' => 2]);
        $response = $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, $request);
        $payload  = $this->payload($response);

        $this->assertCount(1, $payload['items']);
        $this->assertNull($payload['nextCursor']);
    }

    public function test_invoke_forwards_a_valid_cursor_to_the_repository(): void
    {
        $cursor = '0198a1c0-0000-7000-8000-000000000009';

        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->once())
            ->method('findPublicByTagValue')
            ->with(
                $this->anything(),
                $this->callback(static fn(?UuidV7 $uuid) => $uuid?->toRfc4122() === $cursor),
                25,
            )
            ->willReturn([]);
        $imageRepository->method('countByTagValue')->willReturn(0);

        $request = new Request(['cursor' => $cursor]);

        $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, $request);
    }

    public function test_invoke_never_exposes_vendor_identity(): void
    {
        $imageRepository = $this->createStub(PortfolioImageRepository::class);
        $imageRepository->method('findPublicByTagValue')->willReturn([
            $this->image('0198a1c0-0000-7000-8000-000000000002', 'https://cdn/2.jpg'),
        ]);
        $imageRepository->method('countByTagValue')->willReturn(1);

        $response = $this->action($this->tagValueRepository(), $imageRepository)(self::TAG_VALUE_ID, new Request());

        $this->assertSame(['id', 'url', 'tagsByGroup'], array_keys($this->payload($response)['items'][0]));
        $this->assertStringNotContainsString('Studio Lumiere', (string) $response->getContent());
    }

    private function action(
        TagValueRepository $tagValueRepository,
        PortfolioImageRepository $imageRepository,
    ): GetTagValuePortfolioImagesAction {
        return new GetTagValuePortfolioImagesAction($tagValueRepository, $imageRepository);
    }

    private function tagValueRepository(): TagValueRepository
    {
        $tagType  = (new TagType())->setLabel('Sous-style');
        $tagValue = (new TagValue())->setLabel('Bohème')->setTagType($tagType)->setIsActive(true);

        $repository = $this->createStub(TagValueRepository::class);
        $repository->method('find')->willReturn($tagValue);

        return $repository;
    }

    private function image(string $id, string $url): PortfolioImage
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumiere');

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
    private function payload(\Symfony\Component\HttpFoundation\JsonResponse $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
