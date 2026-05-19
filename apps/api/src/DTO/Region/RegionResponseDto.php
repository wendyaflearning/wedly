<?php

declare(strict_types=1);

namespace App\DTO\Region;

use App\Entity\Region\Region;

final readonly class RegionResponseDto
{
    public string $id;
    public string $name;

    public function __construct(Region $region)
    {
        $this->id   = $region->getId()->toString();
        $this->name = $region->getName();
    }
}
