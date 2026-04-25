<?php

declare(strict_types=1);

namespace App\DTO;

interface DTOInterface
{
    public static function fromArray(array $data): static;
}
