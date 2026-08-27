<?php

declare(strict_types=1);

namespace App\Tests\Unit\ArgumentResolver;

use App\ArgumentResolver\PublicActiveTagValueResolver;
use App\Attribute\PublicActiveTagValue;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\TagValueRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;

final class PublicActiveTagValueResolverTest extends TestCase
{
    private const TAG_VALUE_ID = '0198a1c0-0000-7000-8000-0000000000ff';

    public function test_it_ignores_an_argument_without_the_attribute(): void
    {
        $repository = $this->createMock(TagValueRepository::class);
        $repository->expects($this->never())->method('find');

        $resolved = $this->resolve($repository, $this->request(), $this->metadata(attributes: []));

        $this->assertSame([], $resolved);
    }

    public function test_it_returns_404_when_the_tag_value_is_unknown(): void
    {
        $repository = $this->createStub(TagValueRepository::class);
        $repository->method('find')->willReturn(null);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Sous-style introuvable.');
        $this->expectExceptionCode(404);

        $this->resolve($repository, $this->request(), $this->metadata());
    }

    public function test_it_returns_404_when_the_tag_value_is_inactive(): void
    {
        $repository = $this->createStub(TagValueRepository::class);
        $repository->method('find')->willReturn((new TagValue())->setLabel('Bohème')->setIsActive(false));

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Sous-style introuvable.');
        $this->expectExceptionCode(404);

        $this->resolve($repository, $this->request(), $this->metadata());
    }

    public function test_it_returns_404_when_the_route_parameter_is_missing(): void
    {
        $repository = $this->createMock(TagValueRepository::class);
        $repository->expects($this->never())->method('find');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        $this->resolve($repository, new Request(), $this->metadata());
    }

    public function test_it_returns_the_active_tag_value_untouched(): void
    {
        $tagValue = (new TagValue())->setLabel('Bohème')->setIsActive(true);

        $repository = $this->createMock(TagValueRepository::class);
        $repository->expects($this->once())->method('find')->with(self::TAG_VALUE_ID)->willReturn($tagValue);

        $resolved = $this->resolve($repository, $this->request(), $this->metadata());

        $this->assertSame([$tagValue], $resolved);
    }

    public function test_it_reads_the_route_parameter_named_by_the_attribute(): void
    {
        $tagValue = (new TagValue())->setLabel('Bohème')->setIsActive(true);

        $repository = $this->createMock(TagValueRepository::class);
        $repository->expects($this->once())->method('find')->with('autre-id')->willReturn($tagValue);

        $request = new Request();
        $request->attributes->set('sousStyleId', 'autre-id');

        $resolved = $this->resolve(
            $repository,
            $request,
            $this->metadata(attributes: [new PublicActiveTagValue('sousStyleId')]),
        );

        $this->assertSame([$tagValue], $resolved);
    }

    /** @return array<int, mixed> */
    private function resolve(TagValueRepository $repository, Request $request, ArgumentMetadata $metadata): array
    {
        return [...(new PublicActiveTagValueResolver($repository))->resolve($request, $metadata)];
    }

    private function request(): Request
    {
        $request = new Request();
        $request->attributes->set('tagValueId', self::TAG_VALUE_ID);

        return $request;
    }

    /** @param object[]|null $attributes */
    private function metadata(?array $attributes = null): ArgumentMetadata
    {
        return new ArgumentMetadata(
            'tagValue',
            TagValue::class,
            false,
            false,
            null,
            false,
            $attributes ?? [new PublicActiveTagValue()],
        );
    }
}
