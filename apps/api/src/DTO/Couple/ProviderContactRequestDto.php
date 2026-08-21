<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Contexte transmis quand le parcours est parti de « Je veux entrer en contact »
 * plutôt que d'un simple épingle (WED-49). Sa présence décide de la création
 * d'un ProviderLead, pas des écrans traversés (PROVIDER-LEAD-001).
 */
final readonly class ProviderContactRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $vendorId,

        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 100)]
        public string $serviceLabel,
    ) {}
}
