<?php

declare(strict_types=1);

namespace App\DTO\Couple\ProviderLead;

use App\Enum\Couple\CoupleLeadStatus;

/**
 * Demande de contact `DEBLOQUEE` (PROVIDER-LEAD-005) : le prestataire a accepté
 * le lead, sa fiche et ses coordonnées deviennent lisibles par le couple.
 *
 * Le bloc `vendor` n'existe que dans cette forme-là ; le front discrimine sur
 * `status` et n'a aucun masquage à faire.
 *
 * `vendorId` fait doublon avec `vendor['id']` et c'est voulu : le champ est au
 * même niveau que dans la forme masquée, donc la galerie lit une seule clé quel
 * que soit le statut de la demande. Une branche de lecture par statut, côté
 * front, pour un identifiant identique dans les deux cas, se paierait un jour
 * d'un oubli sur l'une des deux (PROVIDER-LEAD-009).
 */
final readonly class UnlockedProviderLeadResponseDto
{
    public string $id;
    public string $status;
    /** Voir MaskedProviderLeadResponseDto : même clé, quel que soit le statut. */
    public string $vendorId;
    public string $requestedAt;
    public ?string $category;
    /** @var string[] */
    public array $zones;
    /** Voir MaskedProviderLeadResponseDto : identifiant de la photo, pas du prestataire (WED-182). */
    public ?string $portfolioImageId;
    public ?string $photoUrl;
    /** @var array<string, mixed> */
    public array $vendor;

    /**
     * @param string[]             $zones
     * @param array<string, mixed> $vendor
     */
    public function __construct(
        string $id,
        CoupleLeadStatus $status,
        string $vendorId,
        \DateTimeImmutable $requestedAt,
        ?string $category,
        array $zones,
        ?string $portfolioImageId,
        ?string $photoUrl,
        array $vendor,
    ) {
        $this->id               = $id;
        $this->status           = $status->value;
        $this->vendorId         = $vendorId;
        $this->requestedAt      = $requestedAt->format(\DateTimeInterface::ATOM);
        $this->category         = $category;
        $this->zones            = $zones;
        $this->portfolioImageId = $portfolioImageId;
        $this->photoUrl         = $photoUrl;
        $this->vendor           = $vendor;
    }
}
