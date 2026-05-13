<?php

declare(strict_types=1);

namespace App\DTO\Culture;

use App\Entity\Culture\Culture;

final readonly class CultureResponseDto
{
    public string $id;
    public string $name;

    public function __construct(Culture $culture)
    {
        $this->id   = $culture->getId()->toString();
        $this->name = $culture->getName();
    }
}
