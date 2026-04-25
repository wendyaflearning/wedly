<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\Vendor\Step\ProfessionsDto;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

readonly class ProfessionsStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, ProfessionsDto $professionsDto): void
    {
        $serviceIds = $professionsDto->serviceIds;

        $services = [];
        foreach ($serviceIds as $serviceId) {
            $service = $this->em->getRepository(Service::class)->find($serviceId);
            if ($service === null) {
                throw new \DomainException(sprintf('Service introuvable : %s', $serviceId), 422);
            }
            $services[] = $service;
        }

        $vendor->getServices()->clear();
        foreach ($services as $service) {
            $vendor->addService($service);
        }
    }
}
