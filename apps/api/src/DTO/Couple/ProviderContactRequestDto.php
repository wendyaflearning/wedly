<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

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
 * Les deux identifiants sont désormais nullables parce qu'ils désignent la même
 * cible par deux chemins : `portfolioImageId` suffit à retrouver le prestataire
 * côté serveur (WED-150, décision verrouillée #1 de WED-49 — aucun vendorId ne
 * doit transiter côté client). `vendorId` reste accepté le temps que le
 * frontend bascule (US2 / US3a) : il n'est plus le seul porteur du prestataire,
 * juste le chemin historique. Ce qui n'est pas permis, c'est de n'en envoyer
 * aucun — la demande n'aurait alors aucune cible.
 */
final readonly class ProviderContactRequestDto
{
    public function __construct(
        #[Assert\Uuid]
        public ?string $vendorId = null,

        #[Assert\Uuid]
        public ?string $portfolioImageId = null,
    ) {}

    /**
     * La contrainte porte sur la classe et pas sur un champ : aucun des deux
     * identifiants n'est requis isolément, c'est leur absence conjointe qui est
     * refusée. La violation est rattachée à `vendorId` pour que le frontend ait
     * un chemin à afficher, l'absence de cible n'ayant pas de champ propre.
     */
    #[Assert\Callback]
    public function validateTargetIsProvided(ExecutionContextInterface $context): void
    {
        if ($this->vendorId === null && $this->portfolioImageId === null) {
            $context->buildViolation('vendorId ou portfolioImageId est requis.')
                ->atPath('vendorId')
                ->addViolation();
        }
    }
}
