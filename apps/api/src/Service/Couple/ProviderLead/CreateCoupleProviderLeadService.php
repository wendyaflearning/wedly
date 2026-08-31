<?php

declare(strict_types=1);

namespace App\Service\Couple\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Repository\ProviderLead\ProviderLeadRepository;
use App\Service\Vendor\VendorResolver;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Demande de mise en relation par un couple déjà connecté (WED-156 / US3c).
 *
 * La photo passe par VendorResolver, la même porte que le parcours
 * d'inscription (WED-150) : « publiée dans Wedream » et « ce prestataire est
 * joignable » ont une seule définition et un seul message d'erreur, qu'on
 * arrive par l'onboarding ou par cet endpoint.
 *
 * Le flush est ici et pas dans l'Action (ADR-006).
 */
final readonly class CreateCoupleProviderLeadService
{
    public function __construct(
        private EntityManagerInterface $em,
        private VendorResolver $vendorResolver,
        private ProviderLeadRepository $providerLeadRepository,
    ) {}

    /**
     * Le budget vient du Wedding du couple connecté, jamais du corps de la
     * requête. À l'inscription il transite dans le DTO parce qu'aucun mariage
     * n'existe encore au moment où les demandes sont créées ; ici il en existe
     * un, et le lire dedans est à la fois la seule source de vérité et le seul
     * moyen d'éviter qu'un client dicte le montant qualifiant sa propre demande.
     * Le lead en garde ensuite sa propre copie (PROVIDER-LEAD-004) : une
     * révision de budget plus tard ne doit pas réécrire une demande qu'un
     * prestataire est déjà en train de traiter.
     *
     * Recontacter un prestataire déjà en lead est un no-op silencieux, pas une
     * erreur : le parcours peut légitimement y revenir depuis une autre photo,
     * et un 409 ne lui donnerait rien à corriger (critère d'acceptation
     * WED-156, contrainte PROVIDER-LEAD-007). La première demande garde sa
     * photo — c'est celle qui a déclenché la mise en relation.
     *
     * La lecture préalable couvre le cas courant sans tenter d'INSERT. Elle ne
     * remplace pas la contrainte unique : deux requêtes concurrentes peuvent la
     * franchir toutes les deux, et `UNIQ_provider_lead_couple_vendor` reste le
     * seul filet réel. D'où le catch, silencieux pour la même raison que le
     * no-op ci-dessus.
     *
     * @return bool true si un lead a été créé, false si le couple avait déjà
     *              demandé ce prestataire — l'appelant en tire le code HTTP
     *
     * @throws \DomainException 422 si la photo est inconnue ou masquée dans Wedream, ou si le prestataire n'est pas actif
     */
    public function create(Couple $couple, string $portfolioImageId): bool
    {
        $vendor     = $this->vendorResolver->resolveActive(null, $portfolioImageId);
        $crushPhoto = $this->vendorResolver->resolveCrushPhoto($vendor, $portfolioImageId);

        if ($this->providerLeadRepository->findOneBy(['couple' => $couple, 'vendor' => $vendor]) !== null) {
            return false;
        }

        $this->em->persist(new ProviderLead(
            $couple,
            $vendor,
            $couple->getWedding()->getBudgetCents(),
            $crushPhoto,
        ));

        try {
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            // Course perdue contre une requête concurrente : le lead existe,
            // c'est exactement le résultat attendu.
            return false;
        }

        return true;
    }
}
