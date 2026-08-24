<?php

declare(strict_types=1);

namespace App\Repository\User;

use App\Entity\User\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Centralise la vérification faite jusqu'ici en ligne dans
     * AdminVendorDraftService, pour ne pas la dupliquer une troisième fois.
     */
    public function isEmailTaken(string $email): bool
    {
        return $this->findOneBy(['email' => $email]) !== null;
    }
}
