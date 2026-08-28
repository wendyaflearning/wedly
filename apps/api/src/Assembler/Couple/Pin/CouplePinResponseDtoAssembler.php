<?php

declare(strict_types=1);

namespace App\Assembler\Couple\Pin;

use App\DTO\Couple\Pin\CouplePinResponseDto;
use App\Entity\Couple\CouplePin;

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
        return new CouplePinResponseDto(
            id:       $pin->getId()->toRfc4122(),
            photoUrl: $pin->getPortfolioImage()->getUrl(),
            pinnedAt: $pin->getCreatedAt(),
        );
    }
}
