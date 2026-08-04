<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Vendor\Portfolio;

use App\DTO\Vendor\Portfolio\PortfolioTagResponseDto;
use App\Entity\Wedding\WeddingStyle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;

final class PortfolioTagResponseDtoTest extends TestCase
{
    public function test_from_tags_returns_json_array_not_object_when_input_keys_have_gaps(): void
    {
        $style = $this->createStub(WeddingStyle::class);
        $style->method('getId')->willReturn(Uuid::fromString('01930000-0000-7000-8000-000000000010'));
        $style->method('getName')->willReturn('Bohème');
        $style->method('getSlug')->willReturn('boheme');

        // Mimics Doctrine's Collection::toArray() after removeElement(): the
        // remaining item keeps its original, non-zero key.
        $tags = [1 => $style];

        $result = PortfolioTagResponseDto::fromTags($tags);

        $this->assertStringStartsWith('[', json_encode($result, JSON_THROW_ON_ERROR));
    }
}
