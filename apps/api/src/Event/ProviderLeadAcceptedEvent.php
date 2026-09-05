<?php

declare(strict_types=1);

namespace App\Event;

/**
 * Le prestataire a accepté une demande de mise en relation (WED-54).
 *
 * Event distinct de `ProviderLeadRefusedEvent`, et c'est tout l'intérêt : celui-ci
 * porte le nom du prestataire, l'autre ne le porte pas — parce qu'un refus ne
 * dévoile jamais l'identité du prestataire au couple (PROVIDER-LEAD-005). La
 * règle tient dans la *forme* des deux objets, pas dans un `if` posé au fond
 * d'un listener : même principe que le couple masqué / débloqué côté DTO.
 *
 * Que des scalaires, jamais le `ProviderLead` : un listener qui reçoit l'entité
 * peut remonter jusqu'à `getWedding()->getCultures()`, et la garantie RGPD
 * (Article 9) redeviendrait affaire de discipline.
 */
final readonly class ProviderLeadAcceptedEvent
{
    public function __construct(
        public string $leadId,
        public string $coupleEmail,
        public string $coupleFirstName,
        /** Lisible ici, et seulement ici : l'acceptation est ce qui le dévoile. */
        public string $vendorBrandName,
    ) {}
}
