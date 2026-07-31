<?php

declare(strict_types=1);

namespace App\DTO\Specialty;

use App\Entity\Vendor\Specialty;

final readonly class SpecialtyResponseDto
{
    public string $id;
    public string $name;
    public string $slug;
    public string $serviceId;

    public function __construct(Specialty $specialty)
    {
        $this->id        = $specialty->getId()->toString();
        $this->name      = $specialty->getName();
        $this->slug      = $specialty->getSlug();
        $this->serviceId = $specialty->getService()->getId()->toString();
    }
}
