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
     * historique, revalidé ici — existence et disponibilité — pour répondre 422
     * plutôt que 500 (PROVIDER-LEAD-003). En son absence, le prestataire est
     * déduit côté serveur de la photo : c'est la cible réelle du parcours, et le
     * couple n'a jamais eu à connaître son identifiant (WED-150).
     *
     * « Joignable dans Wedream » a une seule définition pour les deux chemins
     * (WED-193) : le compte est actif, la fiche est publiée et la vitrine
     * Wedream est active. Le chemin photo hérite déjà des deux dernières
     * conditions de `findVisiblePortfolioImage()` ; on les revérifie ici pour
     * que le chemin `vendorId` — la demande de contact posée à l'inscription
     * avec un identifiant de prestataire — n'ouvre pas une porte plus large que
     * le reste du parcours.
     *
     * @throws \DomainException 422 si aucune cible n'est fournie, si le prestataire est inconnu ou s'il n'est pas joignable dans Wedream
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

        if (
            !$vendor instanceof Vendor
            || $vendor->getStatus() !== VendorStatus::Active
            || !$vendor->isPublished()
            || !$vendor->isWedreamEnabled()
        ) {
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
     * @throws \DomainException 422 si la photo est inconnue, plus publiée dans Wedream ou appartient à un autre prestataire
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
     * « Publiée dans Wedream » ou rien. La condition est isolée ici parce que
     * les appelants s'appuient tous dessus — la résolution du prestataire depuis
     * la photo, la validation de la photo coup de cœur, l'épinglage qui ne cible
     * aucun prestataire (COUPLE-PIN-004) et le pin posé à l'inscription.
     *
     * Depuis WED-193 la définition est unique : `findWedreamVisibleById()`
     * applique les trois mêmes conditions que la galerie publique et que la
     * lecture des épinglés (WedreamVisibilityCriteria) — fiche publiée, vitrine
     * Wedream active, photo taguée visible. Un prestataire qui coupe Wedream
     * entre le browse et le clic fait donc échouer l'écriture en 422 ; plus
     * aucune ligne ne peut naître invisible. Le coût : un SELECT au lieu d'un
     * hit d'identity map sur le second appel du parcours « photo seule ».
     *
     * @throws \DomainException 422 si la photo est inconnue ou n'est plus publiée dans Wedream
     */
    public function findVisiblePortfolioImage(string $portfolioImageId): PortfolioImage
    {
        $image = $this->portfolioImageRepository->findWedreamVisibleById($portfolioImageId);

        if (!$image instanceof PortfolioImage) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }
}
