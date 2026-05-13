<?php

declare(strict_types=1);

namespace App\DTO\Confession;

use App\Entity\Confession\Confession;

final readonly class ConfessionResponseDto
{
    public string $id;
    public string $name;

    public function __construct(Confession $confession)
    {
        $this->id   = $confession->getId()->toString();
        $this->name = $confession->getName();
    }
}
