<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Public\TagValue;

use App\Controller\Public\TagValue\GetTagValuePortfolioImagesAction;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\ArgumentResolver\CursorPaginationValueResolver;
use App\ArgumentResolver\PublicActiveTagValueResolver;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\TagValueRepository;
use App\ValueObject\CursorPagination;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ArgumentResolver;
use Symfony\Component\HttpKernel\Controller\ArgumentResolver\DefaultValueResolver;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadataFactory;
use Symfony\Component\Uid\UuidV7;

final class GetTagValuePortfolioImagesActionTest extends TestCase
{
    private const TAG_VALUE_ID = '0198a1c0-0000-7000-8000-0000000000ff';

    private const VENDOR_ID = '0198a1c0-0000-7000-8000-0000000000bb';

    public function test_invoke_asks_the_repository_for_one_extra_row(): void
    {
        $cursor = UuidV7::fromString('0198a1c0-0000-7000-8000-000000000009');

        $imageRepository = $this->createMock(PortfolioImageRepository::class);
        $imageRepository->expects($this->once())
            ->method('findPublicByTagValue')
            ->with($this->anything(), $cursor, 11)
            ->willReturn([]);
        $imageRepository->method('countByTagValue')->willReturn(0);

        $response = $this->action($imageRepository)(
            $this->activeTagValue(),
            new CursorPagination(10, $cursor),
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            ['items' => [], 'nextCursor' => null, 'total' => 0],
            $this->payload($response),
        );
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

        $response = $this->action($imageRepository)(
            $this->activeTagValue(),
            new CursorPagination(2),
        );
        $payload = $this->payload($response);

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

        $response = $this->action($imageRepository)(
            $this->activeTagValue(),
            new CursorPagination(2),
        );
        $payload = $this->payload($response);

        $this->assertCount(1, $payload['items']);
        $this->assertNull($payload['nextCursor']);
    }

    public function test_invoke_never_exposes_vendor_identity(): void
    {
        $imageRepository = $this->createStub(PortfolioImageRepository::class);
        $imageRepository->method('findPublicByTagValue')->willReturn([
            $this->image('0198a1c0-0000-7000-8000-000000000002', 'https://cdn/2.jpg'),
        ]);
        $imageRepository->method('countByTagValue')->willReturn(1);

        $response = $this->action($imageRepository)(
            $this->activeTagValue(),
            new CursorPagination(),
        );

        $item = $this->payload($response)['items'][0];

        // L'intention du test n'a pas changé : un identifiant opaque, oui ; un
        // nom, jamais. C'est l'assertion sur la marque qui la porte, pas la
        // liste de clés (PROVIDER-LEAD-009).
        $this->assertSame(['id', 'url', 'tagsByGroup', 'vendorId'], array_keys($item));
        $this->assertSame(self::VENDOR_ID, $item['vendorId']);
        $this->assertStringNotContainsString('Studio Lumiere', (string) $response->getContent());
    }

    /**
     * Régression : avant l'extraction du TagValue dans un resolver, un sous-style
     * inconnu combiné à un curseur invalide renvoyait 400 au lieu de 404, parce que
     * la pagination était résolue avant que le controller ne vérifie le sous-style.
     *
     * On rejoue ici la vraie résolution d'arguments de Symfony sur la signature
     * réelle du controller : c'est l'ordre des paramètres qui rétablit la priorité.
     */
    public function test_unknown_tag_value_wins_over_an_invalid_cursor(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn(null);

        $controller = $this->action($this->createStub(PortfolioImageRepository::class));

        $request = Request::create('/api/v1/tag-values/'.self::TAG_VALUE_ID.'/portfolio-images?cursor=nimportequoi');
        $request->attributes->set('tagValueId', self::TAG_VALUE_ID);

        $resolver = new ArgumentResolver(new ArgumentMetadataFactory(), [
            new PublicActiveTagValueResolver($tagValueRepository),
            new CursorPaginationValueResolver(),
            new DefaultValueResolver(),
        ]);

        try {
            $resolver->getArguments($request, $controller);
            $this->fail('La résolution aurait dû échouer sur le sous-style introuvable.');
        } catch (\DomainException $exception) {
            $this->assertSame('Sous-style introuvable.', $exception->getMessage());
            $this->assertSame(404, $exception->getCode(), 'Le 404 doit primer sur le 400 du curseur.');
        }
    }

    public function test_a_valid_tag_value_still_surfaces_an_invalid_cursor_as_400(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($this->activeTagValue());

        $controller = $this->action($this->createStub(PortfolioImageRepository::class));

        $request = Request::create('/api/v1/tag-values/'.self::TAG_VALUE_ID.'/portfolio-images?cursor=nimportequoi');
        $request->attributes->set('tagValueId', self::TAG_VALUE_ID);

        $resolver = new ArgumentResolver(new ArgumentMetadataFactory(), [
            new PublicActiveTagValueResolver($tagValueRepository),
            new CursorPaginationValueResolver(),
            new DefaultValueResolver(),
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Curseur invalide.');
        $this->expectExceptionCode(400);

        $resolver->getArguments($request, $controller);
    }

    private function action(PortfolioImageRepository $imageRepository): GetTagValuePortfolioImagesAction
    {
        return new GetTagValuePortfolioImagesAction($imageRepository);
    }

    private function activeTagValue(): TagValue
    {
        return (new TagValue())
            ->setLabel('Bohème')
            ->setTagType((new TagType())->setLabel('Sous-style'))
            ->setIsActive(true);
    }

    private function image(string $id, string $url): PortfolioImage
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumiere');

        // Même patron que l'id de la photo : l'id du prestataire est désormais
        // dans la charge utile, il lui faut donc une valeur déterministe à
        // assérer plutôt qu'un UUID tiré à la construction.
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
