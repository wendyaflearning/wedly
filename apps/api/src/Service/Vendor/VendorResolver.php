<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;

/**
 * Résolution du prestataire ciblé par un geste du parcours Wedream — coup de
 * cœur, épingle, demande de contact — à partir de ce que le client a en main :
 * un identifiant de prestataire, ou seulement celui d'une photo.
 *
 * Le service est né dans CoupleRegistrationService (WED-150) et en a été extrait
 * pour que les endpoints authentifiés d'après-inscription (US3b, US3c) valident
 * exactement de la même façon que le parcours d'inscription : une seule
 * définition de « ce prestataire est joignable », un seul jeu de messages.
 *
 * Il ne fait que lire et valider. Aucun persist, aucun flush, aucune transaction
 * ici — les appelants restent seuls responsables de leurs écritures (ADR-006).
 * Il ne connaît aucun DTO non plus : les identifiants entrent en scalaires, ce
 * qui le rend appelable depuis n'importe quel contexte.
 */
class VendorResolver
{
    public function __construct(
        private readonly VendorRepository $vendorRepository,
        private readonly PortfolioImageRepository $portfolioImageRepository,
    ) {}

    /**
     * Le prestataire est désigné par deux chemins. Le `vendorId` est le chemin
     * historique, revalidé ici — existence et statut — pour répondre 422 plutôt
     * que 500 (PROVIDER-LEAD-003). En son absence, le prestataire est déduit
     * côté serveur de la photo : c'est la cible réelle du parcours, et le couple
     * n'a jamais eu à connaître son identifiant (WED-150).
     *
     * Le contrôle de statut s'applique aux deux chemins. `isVisibleInWedream`
     * est recalculé au tagging, pas à chaque changement de statut du
     * prestataire : une photo encore taguée visible ne dit rien de la
     * disponibilité actuelle de son propriétaire, et sans ce contrôle un vendor
     * désactivé resterait joignable par une vieille photo.
     *
     * @throws \DomainException 422 si aucune cible n'est fournie, si le prestataire est inconnu ou s'il n'est pas actif
     */
    public function resolveActive(?string $vendorId, ?string $portfolioImageId): Vendor
    {
        if ($vendorId !== null) {
            $vendor = $this->vendorRepository->find($vendorId);
        } elseif ($portfolioImageId !== null) {
            $vendor = $this->findVisiblePortfolioImage($portfolioImageId)->getVendor();
        } else {
            // La contrainte de classe du DTO d'inscription refuse déjà les deux
            // absences, mais le service reste le dernier rempart : il est aussi
            // appelé sans passer par MapRequestPayload.
            throw new \DomainException('Cette demande de contact ne cible aucun prestataire.', 422);
        }

        if (!$vendor instanceof Vendor || $vendor->getStatus() !== VendorStatus::Active) {
            throw new \DomainException('Ce prestataire n\'est pas disponible.', 422);
        }

        return $vendor;
    }

    /**
     * La photo coup de cœur vient elle aussi de l'état client. Elle doit
     * appartenir au prestataire ciblé — sinon la carte du couple afficherait le
     * travail d'un tiers — et être publiée dans Wedream, seule galerie où le
     * couple a pu la voir. Un identifiant qui ne satisfait pas ces deux
     * conditions est refusé en 422, jamais silencieusement ignoré : c'est un
     * état client incohérent, pas une absence de photo.
     *
     * @throws \DomainException 422 si la photo est inconnue, masquée dans Wedream ou appartient à un autre prestataire
     */
    public function resolveCrushPhoto(Vendor $vendor, string $portfolioImageId): PortfolioImage
    {
        $image = $this->findVisiblePortfolioImage($portfolioImageId);

        if ($image->getVendor() !== $vendor) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }

    /**
     * Publiée dans Wedream ou rien : la condition est isolée ici parce que les
     * appelants s'appuient tous dessus — la résolution du prestataire depuis la
     * photo, la validation de la photo coup de cœur, et l'épinglage qui ne cible
     * aucun prestataire. `find()` plutôt que `findOneBy(['id' => …])` pour que le
     * second appel du parcours « photo seule » retombe sur l'identity map au lieu
     * de refaire la requête.
     *
     * @throws \DomainException 422 si la photo est inconnue ou masquée dans Wedream
     */
    public function findVisiblePortfolioImage(string $portfolioImageId): PortfolioImage
    {
        $image = $this->portfolioImageRepository->find($portfolioImageId);

        if (!$image instanceof PortfolioImage || !$image->isVisibleInWedream()) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }
}
