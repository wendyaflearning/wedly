<?php

declare(strict_types=1);

namespace App\Enum\Couple;

use App\Enum\ProviderLead\ProviderLeadStatus;

/**
 * Les trois seuls statuts qu'un couple voit sur ses demandes de contact
 * (PROVIDER-LEAD-005). Ils ne sont pas persistés : ce sont une projection du
 * `ProviderLeadStatus` côté prestataire, calculée à la lecture.
 *
 * La projection est une **liste blanche** : seule une décision d'acceptation
 * explicite dévoile la fiche prestataire. Tout statut qui n'exprime pas de
 * décision reste masqué — un statut ambigu ne doit jamais faire fuiter des
 * coordonnées.
 */
enum CoupleLeadStatus: string
{
    case EnAttente = 'EN_ATTENTE';
    case Refusee = 'REFUSEE';
    case Debloquee = 'DEBLOQUEE';

    /**
     * Le `match` est exhaustif et sans branche par défaut : ajouter une valeur
     * à `ProviderLeadStatus` sans décider ce qu'elle montre au couple casse le
     * test qui parcourt `ProviderLeadStatus::cases()`, plutôt que de tomber
     * silencieusement dans un défaut.
     */
    public static function fromProviderLeadStatus(ProviderLeadStatus $status): self
    {
        return match ($status) {
            // Décision d'acceptation. `Confirmed` et `Contacted` sont les
            // valeurs historiques d'un lead qu'un prestataire a pris en charge :
            // elles supposent une acceptation antérieure.
            ProviderLeadStatus::Accepted,
            ProviderLeadStatus::Confirmed,
            ProviderLeadStatus::Contacted => self::Debloquee,

            // Décision de refus. `Unavailable` est un refus pour indisponibilité,
            // pas une absence de réponse.
            ProviderLeadStatus::Refused,
            ProviderLeadStatus::Unavailable => self::Refusee,

            // Aucune décision exprimée. `Closed` est trop générique pour être lu
            // comme une acceptation : il reste masqué.
            ProviderLeadStatus::Pending,
            ProviderLeadStatus::Closed => self::EnAttente,
        };
    }

    public function revealsVendorIdentity(): bool
    {
        return $this === self::Debloquee;
    }
}
