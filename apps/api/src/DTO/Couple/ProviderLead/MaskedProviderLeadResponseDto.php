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
 *
 * `portfolioImageId` fait partie de ce choix (WED-182) : c'est l'identifiant de
 * la photo d'où part la demande, pas celui du prestataire — la galerie l'expose
 * déjà publiquement, et il ne révèle donc rien qu'un couple non connecté ne
 * puisse lire. Il existe pour que la galerie retrouve la demande sans comparer
 * des URLs Cloudinary, qui peuvent être retravaillées.
 */
final readonly class MaskedProviderLeadResponseDto
{
    public string $id;
    public string $status;
    public string $requestedAt;
    public ?string $category;
    /** @var string[] */
    public array $zones;
    public ?string $portfolioImageId;
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
        ?string $portfolioImageId,
        ?string $photoUrl,
    ) {
        $this->id               = $id;
        $this->status           = $status->value;
        $this->requestedAt      = $requestedAt->format(\DateTimeInterface::ATOM);
        $this->category         = $category;
        $this->zones            = $zones;
        $this->portfolioImageId = $portfolioImageId;
        $this->photoUrl         = $photoUrl;
    }
}
