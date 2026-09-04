<?php

declare(strict_types=1);

namespace App\Assembler\Vendor\ProviderLead;

use App\DTO\Vendor\ProviderLead\MaskedVendorProviderLeadResponseDto;
use App\DTO\Vendor\ProviderLead\UnlockedVendorProviderLeadResponseDto;
use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\CoupleLeadStatus;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;
use App\Service\ProviderLead\ProviderLeadSpecialtyTagsResolver;

/**
 * Point unique où se décide ce qu'un prestataire voit d'une demande (WED-51).
 * Pendant exact de `CoupleProviderLeadResponseDtoAssembler` : le tri se fait
 * ici, jamais côté front, et la forme masquée n'a pas de champ où les
 * coordonnées pourraient passer.
 *
 * Le budget est lu sur le lead, pas sur le mariage : il y est figé à la création
 * (PROVIDER-LEAD-002) pour qu'un couple révisant son budget ne réécrive pas une
 * demande qu'un prestataire est déjà en train de traiter.
 */
final readonly class VendorProviderLeadResponseDtoAssembler
{
    public function __construct(
        private ProviderLeadCategoryResolver $categoryResolver,
        private ProviderLeadSpecialtyTagsResolver $specialtyTagsResolver,
    ) {}

    /**
     * @param ProviderLead[] $leads
     *
     * @return array<MaskedVendorProviderLeadResponseDto|UnlockedVendorProviderLeadResponseDto>
     */
    public function assembleList(array $leads): array
    {
        return array_map(fn(ProviderLead $lead) => $this->assemble($lead), $leads);
    }

    public function assemble(
        ProviderLead $lead,
    ): MaskedVendorProviderLeadResponseDto|UnlockedVendorProviderLeadResponseDto {
        $couple     = $lead->getCouple();
        $coupleUser = $couple->getUser();
        $wedding    = $couple->getWedding();

        $status        = $lead->getStatus();
        $id            = $lead->getId()->toRfc4122();
        $firstName     = $coupleUser->getFirstName();
        $weddingDate   = $wedding->getDate();
        $guestCount    = $wedding->getGuestCount();
        $budgetCents   = $lead->getBudgetCents();
        $category      = $this->categoryResolver->resolve($lead)?->getName();
        $specialtyTags = $this->specialtyTagsResolver->resolve($lead);
        $requestedAt   = $lead->getCreatedAt();

        if (!$this->isUnlocked($lead)) {
            return new MaskedVendorProviderLeadResponseDto(
                id:                 $id,
                status:             $status,
                firstName:          $firstName,
                weddingDate:        $weddingDate,
                guestCount:         $guestCount,
                weddingBudgetCents: $budgetCents,
                category:           $category,
                specialtyTags:      $specialtyTags,
                requestedAt:        $requestedAt,
            );
        }

        return new UnlockedVendorProviderLeadResponseDto(
            id:                 $id,
            status:             $status,
            firstName:          $firstName,
            weddingDate:        $weddingDate,
            guestCount:         $guestCount,
            weddingBudgetCents: $budgetCents,
            category:           $category,
            specialtyTags:      $specialtyTags,
            requestedAt:        $requestedAt,
            lastName:           $coupleUser->getLastName(),
            email:              $coupleUser->getEmail(),
            phone:              $couple->getPhone(),
        );
    }

    /**
     * Une seule liste blanche pour les deux côtés, et c'est volontaire.
     *
     * `CoupleLeadStatus` décide déjà quels statuts valent « acceptée » —
     * `Accepted`, plus les historiques `Confirmed`/`Contacted` qui supposent une
     * prise en charge antérieure. Réécrire ce `match` ici laisserait les deux
     * listes diverger un jour : un lead historique s'afficherait « débloqué »
     * chez le couple et masqué chez le prestataire, pour la même ligne en base.
     *
     * On lit cet enum sans le modifier — il reste la propriété du parcours
     * couple (WED-186).
     */
    private function isUnlocked(ProviderLead $lead): bool
    {
        return CoupleLeadStatus::fromProviderLeadStatus($lead->getStatus())->revealsVendorIdentity();
    }
}
