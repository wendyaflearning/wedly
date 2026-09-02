<?php

declare(strict_types=1);

namespace App\Service\Couple\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\CoupleLeadStatus;
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
     * Le no-op reste silencieux, mais il n'est plus muet : le résultat porte le
     * statut réel du lead trouvé (WED-186). Sans lui, l'écran répondait
     * « Demande envoyée » à un couple dont le prestataire venait de refuser —
     * un même texte pour trois situations que le couple vit différemment.
     * Le statut est projeté à la lecture, jamais persisté (CoupleLeadStatus).
     *
     * La lecture préalable couvre le cas courant sans tenter d'INSERT. Elle ne
     * remplace pas la contrainte unique : deux requêtes concurrentes peuvent la
     * franchir toutes les deux, et `UNIQ_provider_lead_couple_vendor` reste le
     * seul filet réel. D'où le catch, silencieux pour la même raison que le
     * no-op ci-dessus — à ceci près qu'il doit désormais relire la ligne
     * gagnante pour en connaître le statut, plutôt que de le supposer.
     *
     * @return CreateCoupleProviderLeadResult `created` dit si un lead est né —
     *         l'appelant en tire le code HTTP — et `status` ce que l'écran doit
     *         annoncer au couple
     *
     * @throws \DomainException 422 si la photo est inconnue ou masquée dans Wedream, ou si le prestataire n'est pas actif
     */
    public function create(Couple $couple, string $portfolioImageId): CreateCoupleProviderLeadResult
    {
        $vendor     = $this->vendorResolver->resolveActive(null, $portfolioImageId);
        $crushPhoto = $this->vendorResolver->resolveCrushPhoto($vendor, $portfolioImageId);

        $existing = $this->providerLeadRepository->findOneBy(['couple' => $couple, 'vendor' => $vendor]);

        if ($existing !== null) {
            return $this->existingLead($existing);
        }

        $lead = new ProviderLead(
            $couple,
            $vendor,
            $couple->getWedding()->getBudgetCents(),
            $crushPhoto,
        );

        $this->em->persist($lead);

        try {
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            // Course perdue contre une requête concurrente : le lead existe,
            // c'est exactement le résultat attendu. Reste à relire lequel a
            // gagné — son statut est le seul que le couple doit voir, et rien
            // ne dit qu'il vaut encore « en attente ».
            return $this->existingLead(
                $this->providerLeadRepository->findOneBy(['couple' => $couple, 'vendor' => $vendor]),
            );
        }

        return new CreateCoupleProviderLeadResult(
            created: true,
            status: CoupleLeadStatus::fromProviderLeadStatus($lead->getStatus()),
        );
    }

    /**
     * Le lead était déjà là : rien n'est créé, et le statut affiché est le sien.
     *
     * Postgres ne lève la violation d'unicité que sur une ligne committée — un
     * concurrent qui échoue laisse l'INSERT passer. La relecture trouve donc
     * toujours quelque chose ; le null-check n'est là que pour ne pas fataler
     * si cette garantie tombe un jour, et « en attente » est alors le seul
     * statut qui ne promet rien de faux au couple.
     */
    private function existingLead(?ProviderLead $lead): CreateCoupleProviderLeadResult
    {
        return new CreateCoupleProviderLeadResult(
            created: false,
            status: $lead === null
                ? CoupleLeadStatus::EnAttente
                : CoupleLeadStatus::fromProviderLeadStatus($lead->getStatus()),
        );
    }
}
