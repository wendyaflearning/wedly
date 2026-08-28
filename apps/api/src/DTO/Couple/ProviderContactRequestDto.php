<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Contexte transmis quand le parcours est parti de « Je veux entrer en contact »
 * plutôt que d'un simple épingle (WED-49). Sa présence décide de la création
 * d'un ProviderLead, pas des écrans traversés (PROVIDER-LEAD-001).
 *
 * Le serveur a besoin du prestataire ciblé, qu'il revalide de toute façon
 * (existence et statut), et de la photo coup de cœur qui a déclenché la demande
 * (PROVIDER-LEAD-004) : elle est affichée sur la carte du couple et sert à
 * dériver la catégorie de la demande. Le libellé du métier que le parcours
 * affiche au couple reste côté client : rien ne le lit ici et rien ne le
 * persiste, l'envoyer reviendrait à valider une donnée pour la jeter.
 *
 * `portfolioImageId` est optionnel : une demande de contact peut partir d'un
 * point d'entrée sans photo, et la carte s'affiche alors sans visuel.
 */
final readonly class ProviderContactRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $vendorId,

        #[Assert\Uuid]
        public ?string $portfolioImageId = null,
    ) {}
}
