<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

/**
 * Issue d'une tentative d'envoi de l'email de lancement WedDream pour un prestataire.
 *
 * Enum pur (non backed) : cette valeur n'est jamais persistée, elle ne sert qu'au
 * résumé restitué à l'appelant. Le statut stocké en base reste VendorEmailLogStatus.
 */
enum VendorWeddreamLaunchOutcome
{
    case Sent;
    case Skipped;
    case Failed;
    case DryRun;
}
