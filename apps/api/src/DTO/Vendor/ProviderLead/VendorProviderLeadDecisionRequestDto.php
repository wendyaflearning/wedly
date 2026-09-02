<?php

declare(strict_types=1);

namespace App\DTO\Vendor\ProviderLead;

use App\Enum\ProviderLead\ProviderLeadDecision;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Accepter ou refuser une demande de mise en relation (WED-51).
 *
 * Le champ est typé par l'enum, pas par une chaîne validée ensuite :
 * `MapRequestPayload` refuse en 422 toute valeur hors liste avant même que le
 * service soit appelé. Le lead visé vient de l'URL, jamais du corps.
 */
final readonly class VendorProviderLeadDecisionRequestDto
{
    public function __construct(
        #[Assert\NotNull]
        public ProviderLeadDecision $decision,
    ) {}
}
