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
 */
final readonly class UnlockedProviderLeadResponseDto
{
    public string $id;
    public string $status;
    public string $requestedAt;
    public ?string $category;
    /** @var string[] */
    public array $zones;
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
        \DateTimeImmutable $requestedAt,
        ?string $category,
        array $zones,
        ?string $photoUrl,
        array $vendor,
    ) {
        $this->id          = $id;
        $this->status      = $status->value;
        $this->requestedAt = $requestedAt->format(\DateTimeInterface::ATOM);
        $this->category    = $category;
        $this->zones       = $zones;
        $this->photoUrl    = $photoUrl;
        $this->vendor      = $vendor;
    }
}
