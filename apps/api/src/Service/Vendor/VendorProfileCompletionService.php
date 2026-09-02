<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;

final readonly class VendorProfileCompletionService
{
    public function __construct(
        private PortfolioStepHandler    $portfolioStepHandler,
        private ZonesPricingStepHandler $zonesPricingStepHandler,
    ) {}

    /** @return array{bio: bool, styles: bool, portfolio: bool, disponibilites: bool, zone: bool, tarifs: bool} */
    public function check(Vendor $vendor): array
    {
        $zonesAndTarifsFilled = $this->zonesPricingStepHandler->isFilled($vendor);

        return [
            'bio'            => $vendor->getBio() !== null && trim($vendor->getBio()) !== '',
            'styles'         => !$vendor->getStyles()->isEmpty(),
            'portfolio'      => $this->portfolioStepHandler->isFilled($vendor),
            // Une liste d'indisponibilités vide est une réponse valide : le prestataire est
            // disponible sur toutes les dates. Le critère est donc toujours satisfait.
            'disponibilites' => true,
            'zone'           => $zonesAndTarifsFilled,
            'tarifs'         => $zonesAndTarifsFilled,
        ];
    }

    /**
     * Source unique de vérité des sections qui conditionnent la publication.
     * Les styles restent hors du calcul (cf. WED-19).
     *
     * @return array{bio: bool, portfolio: bool, disponibilites: bool, zone: bool, tarifs: bool}
     */
    public function checkForPublish(Vendor $vendor): array
    {
        $completion = $this->check($vendor);
        unset($completion['styles']);

        return $completion;
    }
}
