<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\Vendor\Step\ExperiencesDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

readonly class ExperiencesStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, ExperiencesDto $experiencesDto): void
    {
        if ($experiencesDto->cultureIds !== null) {
            $cultures = [];
            foreach ($experiencesDto->cultureIds as $id) {
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

        if ($experiencesDto->confessionIds !== null) {
            $confessions = [];
            foreach ($experiencesDto->confessionIds as $id) {
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
}
