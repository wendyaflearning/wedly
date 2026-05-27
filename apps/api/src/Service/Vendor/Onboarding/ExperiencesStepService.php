<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\ExperiencesDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class ExperiencesStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::Experiences;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        $dto = ExperiencesDto::fromArray($data);

        $vendorType = $vendor->resolveVendorType();

        if ($vendorType !== VendorType::Lieu) {
            if (empty($dto->cultureIds)) {
                throw new \DomainException('Le champ culture_ids doit contenir au moins un élément.', 422);
            }
            if (empty($dto->confessionIds)) {
                throw new \DomainException('Le champ confession_ids doit contenir au moins un élément.', 422);
            }
        }

        if ($dto->cultureIds !== null) {
            $cultures = [];
            foreach ($dto->cultureIds as $id) {
                $culture = $this->em->getRepository(Culture::class)->find($id);
                if ($culture === null) {
                    throw new \DomainException(sprintf('Culture introuvable : %s', $id), 422);
                }
                $cultures[] = $culture;
            }
            $vendor->getCultures()->clear();
            foreach ($cultures as $culture) {
                $vendor->addCulture($culture);
            }
        }

        if ($dto->confessionIds !== null) {
            $confessions = [];
            foreach ($dto->confessionIds as $id) {
                $confession = $this->em->getRepository(Confession::class)->find($id);
                if ($confession === null) {
                    throw new \DomainException(sprintf('Confession introuvable : %s', $id), 422);
                }
                $confessions[] = $confession;
            }
            $vendor->getConfessions()->clear();
            foreach ($confessions as $confession) {
                $vendor->addConfession($confession);
            }
        }
    }

    public function isFilled(Vendor $vendor): bool
    {
        return !$vendor->getConfessions()->isEmpty() || !$vendor->getCultures()->isEmpty();
    }

    public function getStepData(Vendor $vendor): array
    {
        return [
            'confession_ids' => $vendor->getConfessions()
                ->map(fn(Confession $confession) => ['id' => $confession->getId()->toString(), 'name' => $confession->getName()])
                ->toArray(),
            'culture_ids' => $vendor->getCultures()
                ->map(fn(Culture $culture) => ['id' => $culture->getId()->toString(), 'name' => $culture->getName()])
                ->toArray(),
        ];
    }
}
