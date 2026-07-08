<?php

declare(strict_types=1);

namespace App\Repository\User;

use App\Entity\User\User;
use App\Enum\User\Role;
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

    /** @return User[] */
    public function findAdmins(): array
    {
        return $this->createQueryBuilder('user')
            ->andWhere('user.roles LIKE :role')
            ->setParameter('role', '%' . Role::Admin->value . '%')
            ->orderBy('user.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
