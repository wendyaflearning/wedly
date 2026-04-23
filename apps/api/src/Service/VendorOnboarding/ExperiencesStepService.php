<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

readonly class ExperiencesStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, array $data): void
    {
        if (array_key_exists('culture_ids', $data)) {
            $cultures = [];
            foreach ($data['culture_ids'] as $id) {
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

        if (array_key_exists('confession_ids', $data)) {
            $confessions = [];
            foreach ($data['confession_ids'] as $id) {
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
