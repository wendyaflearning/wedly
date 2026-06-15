<?php

declare(strict_types=1);

namespace App\Handler\Vendor\Onboarding;

use App\DTO\Vendor\Step\ProfessionsRequestDto;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class ProfessionsStepHandler extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::Professions;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var ProfessionsRequestDto $dto */
        $dto = $this->validate(ProfessionsRequestDto::fromArray($data));

        $services = [];
        foreach ($dto->serviceIds as $serviceId) {
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

    public function isFilled(Vendor $vendor): bool
    {
        return !$vendor->getServices()->isEmpty();
    }

    public function getStepData(Vendor $vendor): array
    {
        return [
            'services' => $vendor->getServices()
                ->map(fn(Service $service) => ['id' => $service->getId()->toString(), 'name' => $service->getName()])
                ->toArray(),
        ];
    }
}
