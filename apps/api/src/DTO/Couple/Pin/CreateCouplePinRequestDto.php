<?php

declare(strict_types=1);

namespace App\DTO\Couple\Pin;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Épingler depuis Wedream une fois le compte créé (WED-155 / US3b). Le couple
 * n'envoie que la photo : le prestataire est déduit côté serveur, aucun
 * `vendorId` ne transite (décision verrouillée #1 de WED-49), et le couple est
 * lu dans le JWT — un identifiant de couple en entrée laisserait un compte
 * épingler pour un autre.
 *
 * La photo est donc le seul champ, et elle est obligatoire : contrairement au
 * parcours d'inscription où le coup de cœur est facultatif, un épingle sans
 * photo n'a rien à créer.
 */
final readonly class CreateCouplePinRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $portfolioImageId,
    ) {}
}
