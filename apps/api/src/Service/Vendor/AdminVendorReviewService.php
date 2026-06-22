<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Event\VendorRejectedEvent;
use App\Event\VendorValidatedEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final readonly class AdminVendorReviewService
{
    public function __construct(
        private EntityManagerInterface $em,
        private EventDispatcherInterface $eventDispatcher,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    public function validate(Vendor $vendor): void
    {
        $alreadyActive = $vendor->getStatus() === VendorStatus::Active;

        $vendor->setStatus(VendorStatus::Active);
        $vendor->setIsPublished(true);
        $vendor->setReviewedAt(new \DateTimeImmutable());
        $vendor->setRejectionReasons(null);
        $vendor->setRejectionNote(null);
        $vendor->getUser()->setStatus(UserStatus::Active);

        if (!$alreadyActive) {
            $this->eventDispatcher->dispatch(new VendorValidatedEvent(
                $vendor->getUser()->getFirstName(),
                $vendor->getUser()->getEmail(),
                $this->frontendUrl . '/dashboard',
            ));
        }

        $this->em->flush();
    }

    /** @param VendorRejectionReason[] $reasons */
    public function reject(Vendor $vendor, array $reasons, ?string $note): void
    {
        $alreadyRejected = $vendor->getStatus() === VendorStatus::Rejected;

        $vendor->setStatus(VendorStatus::Rejected);
        $vendor->setIsPublished(false);
        $vendor->setReviewedAt(new \DateTimeImmutable());
        $vendor->setRejectionReasons(array_map(fn(VendorRejectionReason $reason) => $reason->value, $reasons));
        $vendor->setRejectionNote($note);
        $vendor->getUser()->setStatus(UserStatus::Suspended);

        if (!$alreadyRejected) {
            $this->eventDispatcher->dispatch(new VendorRejectedEvent(
                $vendor->getUser()->getFirstName(),
                $vendor->getUser()->getEmail(),
                array_map(fn(VendorRejectionReason $reason) => $reason->label(), $reasons),
                $note,
            ));
        }

        $this->em->flush();
    }
}
