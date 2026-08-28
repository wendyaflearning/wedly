<?php

declare(strict_types=1);

namespace App\DTO\Couple\ProviderLead;

use App\Enum\Couple\CoupleLeadStatus;

/**
 * Demande de contact `EN_ATTENTE` ou `REFUSEE` (PROVIDER-LEAD-005).
 *
 * Le masquage tient dans la forme de cet objet, pas dans une condition posée
 * plus loin : il n'existe aucune propriété capable de porter le nom ou les
 * coordonnées du prestataire. Ajouter un champ ici est donc un choix visible
 * en revue, pas un oubli.
 */
final readonly class MaskedProviderLeadResponseDto
{
    public string $id;
    public string $status;
    public string $requestedAt;
    public ?string $category;
    /** @var string[] */
    public array $zones;
    public ?string $photoUrl;

    /**
     * @param string[] $zones
     */
    public function __construct(
        string $id,
        CoupleLeadStatus $status,
        \DateTimeImmutable $requestedAt,
        ?string $category,
        array $zones,
        ?string $photoUrl,
    ) {
        $this->id          = $id;
        $this->status      = $status->value;
        $this->requestedAt = $requestedAt->format(\DateTimeInterface::ATOM);
        $this->category    = $category;
        $this->zones       = $zones;
        $this->photoUrl    = $photoUrl;
    }
}
