<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class VendorUnsubscribeService
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private EntityManagerInterface $em,
    ) {}

    /**
     * Désinscrit des campagnes email la personne derrière ce prestataire.
     *
     * Le flag vit sur le User, pas sur le Vendor : le refus appartient à la personne,
     * pas à sa casquette. Il ne coupe que les campagnes — les emails transactionnels
     * (mot de passe oublié, invitation, rejet) continuent de partir.
     *
     * Idempotent : un prestataire déjà désinscrit ressort en succès sans écriture.
     * C'est volontaire, un lien de désinscription cliqué deux fois n'est pas une erreur.
     *
     * @throws \DomainException 404 si aucun prestataire ne porte cet identifiant
     */
    public function unsubscribeByVendorId(string $vendorId): void
    {
        $vendor = $this->vendorRepository->find($vendorId)
            ?? throw new \DomainException('Prestataire introuvable.', 404);

        $user = $vendor->getUser();

        if ($user->getUnsubscribedAt() !== null) {
            return;
        }

        $user->setUnsubscribedAt(new \DateTimeImmutable());

        $this->em->flush();
    }
}
