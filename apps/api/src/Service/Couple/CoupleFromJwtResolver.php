<?php

declare(strict_types=1);

namespace App\Service\Couple;

use App\Entity\Couple\Couple;
use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Résout le couple courant à partir du JWT, jamais de l'URL ni du corps de la
 * requête — donc un compte ne peut jamais agir pour un autre couple.
 *
 * Extrait des endpoints « pins » (WED-132 / WED-155 / WED-183), où les trois
 * actions recopiaient le même bloc de résolution. Le service se contente de
 * lire : il renvoie `null` quand aucun couple n'est rattaché, et laisse chaque
 * action décider de sa réponse HTTP (404). Aucun couplage au framework HTTP ici.
 */
final class CoupleFromJwtResolver
{
    public function __construct(
        private readonly Security         $security,
        private readonly CoupleRepository $coupleRepository,
    ) {}

    public function resolve(): ?Couple
    {
        $user = $this->security->getUser();

        // `#[IsGranted('ROLE_COUPLE')]` garantit déjà un `User` sur les endpoints
        // concernés ; la garde reste pour que le service soit sûr hors de ce cadre.
        if (!$user instanceof User) {
            return null;
        }

        return $this->coupleRepository->findOneByUser($user);
    }
}
