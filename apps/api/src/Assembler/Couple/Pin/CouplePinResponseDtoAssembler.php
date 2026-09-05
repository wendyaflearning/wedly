<?php

declare(strict_types=1);

namespace App\Assembler\Couple\Pin;

use App\DTO\Couple\Pin\CouplePinResponseDto;
use App\Entity\Couple\CouplePin;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;

/**
 * Single place where a couple pin is projected for the API (WED-132).
 */
final readonly class CouplePinResponseDtoAssembler
{
    /**
     * @param CouplePin[] $pins
     *
     * @return CouplePinResponseDto[]
     */
    public function assembleList(array $pins): array
    {
        return array_map(fn(CouplePin $pin) => $this->assemble($pin), $pins);
    }

    public function assemble(CouplePin $pin): CouplePinResponseDto
    {
        $image = $pin->getPortfolioImage();

        return new CouplePinResponseDto(
            id:               $pin->getId()->toRfc4122(),
            portfolioImageId: $image->getId()->toRfc4122(),
            photoUrl:         $image->getUrl(),
            pinnedAt:         $pin->getCreatedAt(),
            vendorId:         $image->getVendor()->getId()->toRfc4122(),
            tagsByGroup:      $this->tagsByGroup($image),
        );
    }

    /**
     * @return array<string, string[]>
     */
    private function tagsByGroup(PortfolioImage $image): array
    {
        $tagsByGroup = [];

        /** @var TagValue $tag */
        foreach ($image->getTags() as $tag) {
            $tagsByGroup[$tag->getTagType()->getLabel()][] = $tag->getLabel();
        }

        return $tagsByGroup;
    }
}
