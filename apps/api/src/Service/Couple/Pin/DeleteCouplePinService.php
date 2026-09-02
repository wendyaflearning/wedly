<?php

declare(strict_types=1);

namespace App\Service\Couple\Pin;

use App\Entity\Couple\Couple;
use App\Repository\Couple\CouplePinRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Dé-épinglage d'une photo par un couple connecté (WED-183 / US3b).
 *
 * Désactivation, jamais suppression physique : la contrainte unique
 * `UNIQ_couple_pin_couple_image` n'autorise qu'une ligne par couple et par
 * photo, et c'est cette même ligne que le réépinglage réactive. Supprimer
 * physiquement marcherait aussi, mais on perdrait l'historique du geste sans
 * rien gagner.
 *
 * Aucun passage par VendorResolver, contrairement à l'épinglage : un couple doit
 * pouvoir retirer une photo de ses coups de cœur même si le prestataire a depuis
 * quitté Wedream. Refuser en 422 laisserait le cœur bloqué en position remplie.
 *
 * Le flush est ici et pas dans l'Action (ADR-006).
 */
final readonly class DeleteCouplePinService
{
    public function __construct(
        private EntityManagerInterface $em,
        private CouplePinRepository $couplePinRepository,
    ) {}

    /**
     * Le geste est idempotent de bout en bout : une photo jamais épinglée et une
     * photo déjà dé-épinglée mènent au même résultat qu'un dé-épinglage réussi —
     * cette photo n'est plus dans les coups de cœur du couple. Un 404 n'aurait
     * rien à lui faire corriger, et l'interface rejoue volontiers un DELETE
     * après un retour réseau incertain.
     */
    public function delete(Couple $couple, string $portfolioImageId): void
    {
        $pin = $this->couplePinRepository->findOneByCoupleAndPortfolioImageId($couple, $portfolioImageId);

        if ($pin === null || !$pin->isActive()) {
            return;
        }

        $pin->deactivate();
        $this->em->flush();
    }
}
