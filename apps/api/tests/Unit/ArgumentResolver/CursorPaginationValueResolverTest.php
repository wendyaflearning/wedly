<?php

declare(strict_types=1);

namespace App\Tests\Unit\ArgumentResolver;

use App\ArgumentResolver\CursorPaginationValueResolver;
use App\ValueObject\CursorPagination;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;

final class CursorPaginationValueResolverTest extends TestCase
{
    public function test_it_ignores_arguments_of_another_type(): void
    {
        $resolved = $this->resolve(new Request(), $this->metadata(Request::class));

        $this->assertSame([], $resolved);
    }

    public function test_it_ignores_untyped_arguments(): void
    {
        $resolved = $this->resolve(new Request(), $this->metadata(null));

        $this->assertSame([], $resolved);
    }

    public function test_it_defaults_the_limit_when_absent(): void
    {
        $pagination = $this->resolveOne(new Request());

        $this->assertSame(CursorPagination::DEFAULT_LIMIT, $pagination->limit);
        $this->assertNull($pagination->cursor);
    }

    /**
     * @return iterable<string, array{int|string, int}>
     */
    public static function limitProvider(): iterable
    {
        yield 'not a number'      => ['abc', CursorPagination::DEFAULT_LIMIT];
        yield 'empty string'      => ['', CursorPagination::DEFAULT_LIMIT];
        yield 'above the ceiling' => [120, CursorPagination::MAX_LIMIT];
        yield 'at the ceiling'    => [48, CursorPagination::MAX_LIMIT];
        yield 'below the floor'   => [0, CursorPagination::MIN_LIMIT];
        yield 'negative'          => [-5, CursorPagination::MIN_LIMIT];
        yield 'within bounds'     => [10, 10];
        yield 'numeric string'    => ['10', 10];
    }

    #[DataProvider('limitProvider')]
    public function test_it_clamps_the_limit(int|string $requested, int $expected): void
    {
        $pagination = $this->resolveOne(new Request(['limit' => $requested]));

        $this->assertSame($expected, $pagination->limit);
    }

    public function test_it_leaves_the_cursor_null_when_absent(): void
    {
        $this->assertNull($this->resolveOne(new Request())->cursor);
    }

    public function test_it_leaves_the_cursor_null_when_empty(): void
    {
        $this->assertNull($this->resolveOne(new Request(['cursor' => '']))->cursor);
    }

    public function test_it_parses_a_valid_uuid_v7_cursor(): void
    {
        $cursor = '0198a1c0-0000-7000-8000-000000000009';

        $pagination = $this->resolveOne(new Request(['cursor' => $cursor]));

        $this->assertSame($cursor, $pagination->cursor?->toRfc4122());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidCursorProvider(): iterable
    {
        yield 'not a uuid at all' => ['nimportequoi'];
        yield 'uuid v4'           => ['11111111-1111-4111-8111-111111111111'];
        yield 'nil uuid'          => ['00000000-0000-0000-0000-000000000000'];
        yield 'truncated'         => ['0198a1c0-0000-7000-8000'];
    }

    #[DataProvider('invalidCursorProvider')]
    public function test_it_rejects_an_invalid_cursor_with_a_400_domain_exception(string $cursor): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Curseur invalide.');
        $this->expectExceptionCode(400);

        $this->resolveOne(new Request(['cursor' => $cursor]));
    }

    public function test_it_resolves_limit_and_cursor_together(): void
    {
        $cursor = '0198a1c0-0000-7000-8000-000000000009';

        $pagination = $this->resolveOne(new Request(['limit' => 7, 'cursor' => $cursor]));

        $this->assertSame(7, $pagination->limit);
        $this->assertSame($cursor, $pagination->cursor?->toRfc4122());
    }

    /** @return array<int, mixed> */
    private function resolve(Request $request, ArgumentMetadata $metadata): array
    {
        return [...(new CursorPaginationValueResolver())->resolve($request, $metadata)];
    }

    private function resolveOne(Request $request): CursorPagination
    {
        $resolved = $this->resolve($request, $this->metadata(CursorPagination::class));

        $this->assertCount(1, $resolved);
        $this->assertInstanceOf(CursorPagination::class, $resolved[0]);

        return $resolved[0];
    }

    private function metadata(?string $type): ArgumentMetadata
    {
        return new ArgumentMetadata('pagination', $type, false, false, null);
    }
}
