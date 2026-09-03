<?php

declare(strict_types=1);

namespace App\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

/**
 * Format de téléphone français, national (`0612345678`) ou international
 * (`+33612345678`).
 *
 * Extraite de `LegalInfoStepRequestDto` (WED-216), où elle était la seule
 * occurrence du pattern, pour que le parcours couple et le parcours prestataire
 * ne puissent plus diverger sur ce qu'ils acceptent.
 *
 * Ne rend jamais un champ obligatoire : une valeur vide est valide. Combiner
 * avec `Assert\NotBlank` là où le téléphone doit être exigé.
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_PARAMETER)]
final class FrenchPhoneNumber extends Constraint
{
    public const PATTERN = '/^(\+33|0)[1-9]\d{8}$/';

    public string $message = 'Le numéro de téléphone est invalide (ex : 0612345678 ou +33612345678).';
}
