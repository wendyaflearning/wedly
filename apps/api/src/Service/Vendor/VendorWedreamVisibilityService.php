<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

final readonly class VendorWedreamVisibilityService
{
    public function __construct(private EntityManagerInterface $em) {}

    /**
     * Bascule la visibilité publique Wedream du prestataire.
     *
     * La désactivation ne touche ni les photos ni leurs tags : seule la lecture
     * publique de la galerie est coupée, la réactivation restitue l'état tel quel.
     */
    public function setVisibility(Vendor $vendor, bool $enabled): void
    {
        $vendor->setWedreamEnabled($enabled);
        $this->em->flush();
    }
}
