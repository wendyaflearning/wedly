<?php

declare(strict_types=1);

namespace App\DTO\Couple\ProviderLead;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Demander une mise en relation depuis Wedream une fois le compte créé
 * (WED-156 / US3c). Le couple n'envoie que la photo : le prestataire est déduit
 * côté serveur, aucun `vendorId` ne transite (décision verrouillée #1 de
 * WED-49), et le couple est lu dans le JWT — un identifiant de couple en entrée
 * laisserait un compte demander une mise en relation pour un autre.
 *
 * Aucun budget non plus, contrairement au DTO d'inscription : le couple a déjà
 * un mariage, le montant s'y lit et n'a rien à faire dans le corps de la requête
 * où il serait dicté par le client.
 *
 * La photo est donc le seul champ, et elle est obligatoire : sans elle il n'y a
 * plus rien pour désigner le prestataire.
 */
final readonly class CreateCoupleProviderLeadRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $portfolioImageId,
    ) {}
}
