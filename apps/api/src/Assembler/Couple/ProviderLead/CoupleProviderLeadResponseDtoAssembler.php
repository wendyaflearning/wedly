<?php

declare(strict_types=1);

namespace App\Assembler\Couple\ProviderLead;

use App\DTO\Couple\ProviderLead\MaskedProviderLeadResponseDto;
use App\DTO\Couple\ProviderLead\UnlockedProviderLeadResponseDto;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Region\Region;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;
use App\Enum\Couple\CoupleLeadStatus;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;

/**
 * Point unique où se décide ce qu'un couple voit d'une demande de contact
 * (PROVIDER-LEAD-005). Le masquage est fait ici, jamais côté front : le DTO
 * masqué n'a pas de champ où l'identité du prestataire pourrait passer.
 *
 * La photo d'où part la demande sort sous ses deux formes : son identifiant,
 * que la galerie utilise pour retrouver ses vignettes déjà contactées
 * (WED-182), et son URL, que « Mes demandes » affiche telle quelle. Aucune des
 * deux ne dépend du statut — une photo appartient au couple qui l'a envoyée,
 * pas au prestataire qui n'a pas encore répondu.
 */
final readonly class CoupleProviderLeadResponseDtoAssembler
{
    public function __construct(
        private ProviderLeadCategoryResolver $categoryResolver,
    ) {}

    /**
     * @param ProviderLead[] $leads
     *
     * @return array<MaskedProviderLeadResponseDto|UnlockedProviderLeadResponseDto>
     */
    public function assembleList(array $leads): array
    {
        return array_map(fn(ProviderLead $lead) => $this->assemble($lead), $leads);
    }

    public function assemble(ProviderLead $lead): MaskedProviderLeadResponseDto|UnlockedProviderLeadResponseDto
    {
        $status   = CoupleLeadStatus::fromProviderLeadStatus($lead->getStatus());
        $vendor   = $lead->getVendor();
        $category = $this->categoryResolver->resolve($lead);

        $photo = $lead->getPortfolioImage();

        $id               = $lead->getId()->toRfc4122();
        $requestedAt      = $lead->getCreatedAt();
        $zones            = $this->zonesOf($vendor);
        $portfolioImageId = $photo?->getId()->toRfc4122();
        $photoUrl         = $photo?->getUrl();

        if (!$status->revealsVendorIdentity()) {
            return new MaskedProviderLeadResponseDto(
                id:               $id,
                status:           $status,
                vendorId:         $vendor->getId()->toRfc4122(),
                requestedAt:      $requestedAt,
                category:         $category?->getName(),
                zones:            $zones,
                portfolioImageId: $portfolioImageId,
                photoUrl:         $photoUrl,
            );
        }

        return new UnlockedProviderLeadResponseDto(
            id:               $id,
            status:           $status,
            vendorId:         $vendor->getId()->toRfc4122(),
            requestedAt:      $requestedAt,
            category:         $category?->getName(),
            zones:            $zones,
            portfolioImageId: $portfolioImageId,
            photoUrl:         $photoUrl,
            vendor:           $this->vendorProfile($vendor),
        );
    }

    /**
     * Les zones d'intervention du prestataire, pas sa ville : c'est la zone que
     * le couple lit sur la carte, et elle reste lisible même masquée — une
     * région ne désigne personne.
     *
     * @return string[]
     */
    private function zonesOf(Vendor $vendor): array
    {
        return array_values(array_map(
            static fn(Region $region) => $region->getName(),
            $vendor->getRegions()->toArray(),
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function vendorProfile(Vendor $vendor): array
    {
        return [
            'id'            => $vendor->getId()->toRfc4122(),
            'brandName'     => $vendor->getBrandName(),
            'bio'           => $vendor->getBio(),
            'description'   => $vendor->getDescription(),
            'vendorType'    => $vendor->resolveVendorType()->value,
            'services'      => $vendor->resolveVendorServices(),
            'styles'        => array_values(array_map(
                static fn(WeddingStyle $style) => $style->getSlug(),
                $vendor->getStyles()->toArray(),
            )),
            'priceType'     => $vendor->getPriceType()->value,
            'priceMinCents' => $vendor->getPriceMinCents(),
            'priceMaxCents' => $vendor->getPriceMaxCents(),
            'portfolio'     => array_values(array_map(
                static fn(PortfolioImage $image) => $image->getUrl(),
                $vendor->getPortfolioImages()->toArray(),
            )),
            // Le cœur du déblocage : ces trois lignes sont exactement ce que le
            // statut masqué retient.
            'contact'       => [
                'email'   => $vendor->getUser()->getEmail(),
                'phone'   => $vendor->getPhone(),
                'address' => $vendor->getAddress(),
                'zipcode' => $vendor->getZipcode(),
                'city'    => $vendor->getCity(),
            ],
        ];
    }
}
