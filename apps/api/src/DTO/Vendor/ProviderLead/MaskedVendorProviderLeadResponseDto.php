<?php

declare(strict_types=1);

namespace App\DTO\Vendor\ProviderLead;

use App\Enum\ProviderLead\ProviderLeadStatus;

/**
 * Une demande de mise en relation telle que le prestataire la lit **avant**
 * d'avoir décidé (WED-51).
 *
 * Le masquage tient dans la forme de cet objet, pas dans une condition posée
 * plus loin — même principe que `MaskedProviderLeadResponseDto` côté couple.
 * Aucune propriété ne peut porter le nom de famille, l'email ou le téléphone du
 * couple : ajouter un champ ici est un choix visible en revue, jamais un oubli.
 *
 * Culture et confession ne sont pas « masquées » ici : elles ne sont dans
 * aucune des deux formes, masquée comme débloquée. Elles sont réservées à
 * WedMatch (RGPD, Article 9), et une acceptation ne les dévoile pas davantage.
 *
 * `firstName` est le seul prénom que le modèle porte : un `Couple` n'a qu'un
 * `User`. Le prénom du conjoint n'est collecté nulle part aujourd'hui.
 */
final readonly class MaskedVendorProviderLeadResponseDto
{
    public string $id;
    public string $status;
    public string $firstName;
    public string $weddingDate;
    public int $guestCount;
    /** Centimes, comme partout dans le projet — jamais un flottant. */
    public int $weddingBudgetCents;
    public ?string $category;
    /** @var string[] */
    public array $specialtyTags;
    public string $requestedAt;

    /**
     * @param string[] $specialtyTags
     */
    public function __construct(
        string $id,
        ProviderLeadStatus $status,
        string $firstName,
        \DateTimeImmutable $weddingDate,
        int $guestCount,
        int $weddingBudgetCents,
        ?string $category,
        array $specialtyTags,
        \DateTimeImmutable $requestedAt,
    ) {
        $this->id                 = $id;
        $this->status             = $status->value;
        $this->firstName          = $firstName;
        $this->weddingDate        = $weddingDate->format('Y-m-d');
        $this->guestCount         = $guestCount;
        $this->weddingBudgetCents = $weddingBudgetCents;
        $this->category           = $category;
        $this->specialtyTags      = $specialtyTags;
        $this->requestedAt        = $requestedAt->format(\DateTimeInterface::ATOM);
    }
}
