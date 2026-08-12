<?php

declare(strict_types=1);

namespace App\Repository\Admin;

use App\Entity\Admin\AdminNotification;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Admin\AdminNotificationType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AdminNotification>
 */
class AdminNotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AdminNotification::class);
    }

    /** @return AdminNotification[] */
    public function findLatestForRecipient(User $recipient, int $limit, int $offset): array
    {
        return $this->createQueryBuilder('notification')
            ->andWhere('notification.recipient = :recipient')
            ->setParameter('recipient', $recipient)
            ->orderBy('notification.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countForRecipient(User $recipient): int
    {
        return (int) $this->createQueryBuilder('notification')
            ->select('COUNT(notification.id)')
            ->andWhere('notification.recipient = :recipient')
            ->setParameter('recipient', $recipient)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countUnreadForRecipient(User $recipient): int
    {
        return (int) $this->createQueryBuilder('notification')
            ->select('COUNT(notification.id)')
            ->andWhere('notification.recipient = :recipient')
            ->andWhere('notification.readAt IS NULL')
            ->setParameter('recipient', $recipient)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function hasUnreadForRecipientAndProvider(
        User $recipient,
        Vendor $provider,
        AdminNotificationType $type,
    ): bool {
        return (int) $this->createQueryBuilder('notification')
            ->select('COUNT(notification.id)')
            ->andWhere('notification.recipient = :recipient')
            ->andWhere('notification.provider = :provider')
            ->andWhere('notification.type = :type')
            ->andWhere('notification.readAt IS NULL')
            ->setParameter('recipient', $recipient)
            ->setParameter('provider', $provider)
            ->setParameter('type', $type)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }
}
