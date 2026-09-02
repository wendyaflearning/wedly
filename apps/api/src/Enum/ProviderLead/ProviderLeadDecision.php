<?php

declare(strict_types=1);

namespace App\Enum\ProviderLead;

/**
 * Ce qu'un prestataire répond à une demande de mise en relation (WED-51).
 *
 * Enum distinct de `ProviderLeadStatus` et pas un sous-ensemble : celui-ci typé
 * le geste que porte la requête HTTP, l'autre le cycle de vie du lead. Les
 * confondre exposerait dans le corps de l'API des valeurs comme `closed` ou
 * `unavailable`, qu'aucun prestataire n'a le droit de poser lui-même.
 */
enum ProviderLeadDecision: string
{
    case Accept = 'accept';
    case Refuse = 'refuse';

    public function toStatus(): ProviderLeadStatus
    {
        return match ($this) {
            self::Accept => ProviderLeadStatus::Accepted,
            self::Refuse => ProviderLeadStatus::Refused,
        };
    }
}
