<?php

declare(strict_types=1);

namespace App\DTO\Service;

use App\Entity\Vendor\Service;

final readonly class ServiceResponseDto
{
    public string $id;
    public string $name;
    public array  $children;

    public function __construct(Service $service)
    {
        $children = $service->getChildren()->toArray();
        usort($children, fn(Service $a, Service $b) => $a->getSortOrder() <=> $b->getSortOrder());

        $this->id       = $service->getId()->toString();
        $this->name     = $service->getName();
        $this->children = array_map(fn(Service $child) => new self($child), $children);
    }
}
