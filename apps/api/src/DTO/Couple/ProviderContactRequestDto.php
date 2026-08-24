<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Contexte transmis quand le parcours est parti de « Je veux entrer en contact »
 * plutôt que d'un simple épingle (WED-49). Sa présence décide de la création
 * d'un ProviderLead, pas des écrans traversés (PROVIDER-LEAD-001).
 *
 * Le serveur n'a besoin que du prestataire ciblé, qu'il revalide de toute façon
 * (existence et statut). Le libellé du métier que le parcours affiche au couple
 * reste côté client : rien ne le lit ici et rien ne le persiste, l'envoyer
 * reviendrait à valider une donnée pour la jeter.
 */
final readonly class ProviderContactRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $vendorId,
    ) {}
}
