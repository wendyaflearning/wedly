<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

readonly class ProfessionsStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, array $data): void
    {
        $serviceIds = $data['service_ids'] ?? [];

        if (empty($serviceIds)) {
            throw new \DomainException('Au moins un service est requis', 422);
        }

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
