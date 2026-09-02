<?php

declare(strict_types=1);

namespace App\DTO\Vendor\ProviderLead;

use App\Enum\ProviderLead\ProviderLeadStatus;

/**
 * La même demande une fois que le prestataire a accepté (WED-51) : les
 * coordonnées du couple deviennent lisibles.
 *
 * Les coordonnées sont des propriétés typées de premier niveau, pas un
 * sous-tableau `couple`. Un tableau peut gagner une clé sans que la revue le
 * voie ; une propriété rend chaque ajout explicite, ce qui est exactement
 * l'argument qui gouverne la forme masquée.
 *
 * `phone` est nullable et le restera souvent : la saisie est optionnelle à
 * l'écran 7 (WED-216), et les couples inscrits avant n'en ont pas.
 *
 * Comme la forme masquée, cet objet ne porte ni culture ni confession —
 * accepter une demande ne donne pas accès à des données réservées à WedMatch.
 */
final readonly class UnlockedVendorProviderLeadResponseDto
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
    /** Les trois lignes que la forme masquée retient. */
    public ?string $lastName;
    public string $email;
    public ?string $phone;

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
        ?string $lastName,
        string $email,
        ?string $phone,
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
        $this->lastName           = $lastName;
        $this->email              = $email;
        $this->phone              = $phone;
    }
}
