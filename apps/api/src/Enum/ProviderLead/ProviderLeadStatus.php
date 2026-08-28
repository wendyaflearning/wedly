<?php

declare(strict_types=1);

namespace App\Enum\ProviderLead;

/**
 * Cycle de vie d'un lead côté prestataire.
 *
 * `Accepted` et `Refused` sont ajoutés par WED-131 : aucune des valeurs
 * historiques n'exprimait la décision du prestataire, alors que c'est elle —
 * et non un paiement — qui décide désormais de la visibilité de la fiche pour
 * le couple (PROVIDER-LEAD-004). Epic 3 (WED-113) écrira ces deux valeurs
 * quand l'action accepter/refuser sortira de pause ; ce ticket les pose pour
 * que le contrat de lecture existe avant l'écriture.
 *
 * `Closed` reste dans l'enum pour ne pas casser les lignes existantes, mais
 * n'exprime aucune décision : rien ne l'écrit aujourd'hui et il ne doit pas
 * servir de substitut à `Accepted`/`Refused`.
 */
enum ProviderLeadStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Contacted = 'contacted';
    case Closed = 'closed';
    case Unavailable = 'unavailable';
    case Accepted = 'accepted';
    case Refused = 'refused';
}
