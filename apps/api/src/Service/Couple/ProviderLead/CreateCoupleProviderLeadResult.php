<?php

declare(strict_types=1);

namespace App\Service\Couple\ProviderLead;

use App\Enum\Couple\CoupleLeadStatus;

/**
 * Ce que la demande de mise en relation a produit (WED-186 / US3c-bis).
 *
 * `created` porte le code HTTP — 201 si une ressource est née, 200 si le couple
 * avait déjà demandé ce prestataire — et `status` ce que l'écran doit dire.
 * Les deux sont indissociables : un `created: false` seul laissait l'écran
 * annoncer « Demande envoyée » à un couple dont la demande venait d'être
 * refusée. Le statut est celui du lead réellement en base, pas une supposition
 * tirée du fait qu'il existait déjà.
 */
final readonly class CreateCoupleProviderLeadResult
{
    public function __construct(
        public bool $created,
        public CoupleLeadStatus $status,
    ) {}
}
