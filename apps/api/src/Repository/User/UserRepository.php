<?php

declare(strict_types=1);

namespace App\Repository\User;

use App\Entity\User\User;
use App\Enum\User\Role;
use Doctrine\ORM\Query\ResultSetMappingBuilder;
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
        $entityManager = $this->getEntityManager();
        $resultSetMapping = new ResultSetMappingBuilder($entityManager);
        $resultSetMapping->addRootEntityFromClassMetadata(User::class, 'user');

        return $entityManager->createNativeQuery(
            'SELECT * FROM app_user WHERE CAST(roles AS TEXT) LIKE :role ORDER BY created_at ASC',
            $resultSetMapping
        )
            ->setParameter('role', '%"' . Role::Admin->value . '"%')
            ->getResult();
    }
}
