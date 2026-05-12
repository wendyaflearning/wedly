<?php

declare(strict_types=1);

namespace App\DTO\Service;

use App\Entity\Vendor\Service;

final readonly class ServiceResponseDto
{
    public string $id;
    public string $name;

    public function __construct(Service $service)
    {
        $this->id   = $service->getId()->toString();
        $this->name = $service->getName();
    }
}
