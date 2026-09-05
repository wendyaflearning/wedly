<?php

declare(strict_types=1);

namespace App\Event;

/**
 * Un couple vient de demander une mise en relation (WED-51).
 *
 * L'event ne porte que des scalaires, jamais le `ProviderLead` : un listener qui
 * reçoit l'entité peut remonter `getCouple()->getWedding()->getCultures()`, et
 * la garantie RGPD (Article 9) redeviendrait une affaire de discipline — « on
 * n'écrit pas cette ligne ». Ici, culture et confession sont absentes de la
 * *forme* de l'objet : personne en aval ne peut les atteindre, même par erreur.
 * Même principe que `MaskedProviderLeadResponseDto` côté couple.
 *
 * `budgetCents` reste en centimes, comme partout dans le projet ; c'est au
 * listener de le mettre en forme, pas à l'event de décider d'un affichage.
 */
final readonly class ProviderLeadCreatedEvent
{
    /**
     * @param string[] $specialtyTags
     */
    public function __construct(
        public string $leadId,
        public string $vendorId,
        public string $vendorEmail,
        public string $vendorFirstName,
        public string $coupleFirstName,
        public \DateTimeImmutable $weddingDate,
        public int $guestCount,
        public int $budgetCents,
        public ?string $category,
        public array $specialtyTags,
    ) {}
}
