<?php

declare(strict_types=1);

namespace App\Event;

/**
 * Le prestataire a refusé une demande de mise en relation (WED-53).
 *
 * **Aucune propriété ne porte l'identité du prestataire, et c'est le cœur de cet
 * objet.** Un refus laisse la demande masquée côté couple
 * (`CoupleLeadStatus::Refusee`, `revealsVendorIdentity()` à `false`) : le mail
 * qui l'annonce ne peut pas en dire plus que l'écran. Ajouter ici un
 * `vendorBrandName` serait un choix visible en revue, jamais un oubli.
 *
 * `category` est la catégorie demandée, pas le prestataire : « d'autres
 * photographes » ne désigne personne.
 */
final readonly class ProviderLeadRefusedEvent
{
    public function __construct(
        public string $leadId,
        public string $coupleEmail,
        public string $coupleFirstName,
        public ?string $category,
    ) {}
}
