<?php

declare(strict_types=1);

namespace App\Repository\User;

use App\Entity\User\InviteToken;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InviteToken>
 */
class InviteTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InviteToken::class);
    }

    /** @return InviteToken[] */
    public function findActiveVendorInvitations(\DateTimeImmutable $now): array
    {
        return $this->baseVendorInvitationQuery()
            ->andWhere('inviteToken.status = :pendingStatus')
            ->andWhere('inviteToken.expiresAt >= :now')
            ->setParameter('pendingStatus', InviteTokenStatus::Pending->value)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }

    /** @return InviteToken[] */
    public function findExpiredVendorInvitations(\DateTimeImmutable $now): array
    {
        return $this->baseVendorInvitationQuery()
            ->andWhere('inviteToken.status = :expiredStatus OR (inviteToken.status = :pendingStatus AND inviteToken.expiresAt < :now)')
            ->setParameter('expiredStatus', InviteTokenStatus::Expired->value)
            ->setParameter('pendingStatus', InviteTokenStatus::Pending->value)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }

    public function findActiveVendorInvitation(Vendor $vendor, \DateTimeImmutable $now): ?InviteToken
    {
        return $this->createQueryBuilder('inviteToken')
            ->andWhere('inviteToken.vendor = :vendor')
            ->andWhere('inviteToken.persona = :persona')
            ->andWhere('inviteToken.status = :pendingStatus')
            ->andWhere('inviteToken.expiresAt >= :now')
            ->setParameter('vendor', $vendor)
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->setParameter('pendingStatus', InviteTokenStatus::Pending->value)
            ->setParameter('now', $now)
            ->orderBy('inviteToken.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findLatestVendorInvitation(Vendor $vendor): ?InviteToken
    {
        return $this->createQueryBuilder('inviteToken')
            ->andWhere('inviteToken.vendor = :vendor')
            ->andWhere('inviteToken.persona = :persona')
            ->setParameter('vendor', $vendor)
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->orderBy('inviteToken.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function hasUsedVendorInvitation(Vendor $vendor): bool
    {
        return (int) $this->createQueryBuilder('inviteToken')
            ->select('COUNT(inviteToken.id)')
            ->andWhere('inviteToken.vendor = :vendor')
            ->andWhere('inviteToken.persona = :persona')
            ->andWhere('inviteToken.status = :usedStatus')
            ->setParameter('vendor', $vendor)
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->setParameter('usedStatus', InviteTokenStatus::Used->value)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }

    public function hasVendorInvitation(Vendor $vendor): bool
    {
        return (int) $this->createQueryBuilder('inviteToken')
            ->select('COUNT(inviteToken.id)')
            ->andWhere('inviteToken.vendor = :vendor')
            ->andWhere('inviteToken.persona = :persona')
            ->setParameter('vendor', $vendor)
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }

    private function baseVendorInvitationQuery(): \Doctrine\ORM\QueryBuilder
    {
        return $this->createQueryBuilder('inviteToken')
            ->addSelect('vendor', 'user', 'service', 'region')
            ->innerJoin('inviteToken.vendor', 'vendor')
            ->innerJoin('inviteToken.user', 'user')
            ->leftJoin('vendor.services', 'service')
            ->leftJoin('vendor.regions', 'region')
            ->andWhere('inviteToken.persona = :persona')
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->orderBy('inviteToken.expiresAt', 'ASC')
            ->addOrderBy('inviteToken.createdAt', 'DESC');
    }
}
