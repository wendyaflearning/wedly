<?php

declare(strict_types=1);

namespace App\Service\Couple\Pin;

use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
use App\Repository\Couple\CouplePinRepository;
use App\Service\Vendor\VendorResolver;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Épinglage d'une photo par un couple déjà connecté (WED-155 / US3b).
 *
 * La photo passe par VendorResolver, la même porte que le parcours
 * d'inscription (WED-150) : « publiée dans Wedream » a une seule définition et
 * un seul message d'erreur, qu'on arrive par l'onboarding ou par cet endpoint.
 * Le prestataire n'est pas résolu ici — un épingle ne cible pas un prestataire,
 * il ne crée aucun lead (PROVIDER-LEAD-001) et la ligne ne porte que le couple
 * et la photo.
 *
 * Le flush est ici et pas dans l'Action (ADR-006).
 */
final readonly class CreateCouplePinService
{
    public function __construct(
        private EntityManagerInterface $em,
        private VendorResolver $vendorResolver,
        private CouplePinRepository $couplePinRepository,
    ) {}

    /**
     * Réépingler la même photo est un no-op silencieux, pas une erreur : côté
     * couple le geste est idempotent, le cœur est déjà rempli et un 409 n'aurait
     * rien à lui faire corriger (critère d'acceptation WED-155).
     *
     * La lecture préalable couvre le cas courant — un double tap, un retour sur
     * la fiche — sans tenter d'INSERT. Elle ne remplace pas la contrainte
     * unique : deux requêtes concurrentes peuvent la franchir toutes les deux,
     * et `UNIQ_couple_pin_couple_image` reste le seul filet réel. D'où le catch,
     * qui reste vide pour la même raison que le no-op ci-dessus. Sans la lecture
     * préalable, chaque réépingle ferait remonter une erreur SQL et fermerait
     * l'EntityManager pour un geste parfaitement banal.
     *
     * Depuis WED-183 le dé-épinglage désactive la ligne au lieu de la supprimer.
     * La lecture préalable la retrouve donc dans les deux états : active, c'est
     * le no-op ci-dessus ; inactive, on la réactive. Réinsérer serait de toute
     * façon impossible — la contrainte unique tient toujours sur la ligne
     * désactivée.
     *
     * @throws \DomainException 422 si la photo est inconnue ou masquée dans Wedream
     */
    public function create(Couple $couple, string $portfolioImageId): void
    {
        $image = $this->vendorResolver->findVisiblePortfolioImage($portfolioImageId);

        $existing = $this->couplePinRepository->findOneByCoupleAndPortfolioImageId(
            $couple,
            $image->getId()->toRfc4122(),
        );

        if ($existing !== null) {
            if ($existing->isActive()) {
                return;
            }

            $existing->reactivate();
            $this->em->flush();

            return;
        }

        $this->em->persist(new CouplePin($couple, $image));

        try {
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            // Course perdue contre une requête concurrente : la ligne existe,
            // c'est exactement le résultat attendu.
        }
    }
}
