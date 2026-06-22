<?php

declare(strict_types=1);

namespace App\Service\BookingBlocker;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\Vendor\Vendor;
use App\Repository\BookingBlocker\BookingBlockerRepository;
use Doctrine\ORM\EntityManagerInterface;

class BookingBlockerService
{
    public function __construct(
        private readonly BookingBlockerRepository $bookingBlockerRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * @throws \DomainException 422 if the block overlaps an existing one
     */
    public function create(Vendor $vendor, \DateTimeImmutable $start, \DateTimeImmutable $end): BookingBlocker
    {
        $overlapping = $this->bookingBlockerRepository->findOverlapping($vendor, $start, $end);
        if (count($overlapping) > 0) {
            throw new \DomainException('Ce bloc chevauche une indisponibilité existante.', 422);
        }

        $blocker = (new BookingBlocker())
            ->setVendor($vendor)
            ->setStartDate($start)
            ->setEndDate($end);

        $this->entityManager->persist($blocker);
        $this->entityManager->flush();

        return $blocker;
    }

    /**
     * @throws \DomainException 404 if the block does not belong to the vendor
     */
    public function delete(Vendor $vendor, string $blockerId): void
    {
        $blocker = $this->bookingBlockerRepository->findOneBy([
            'id'     => $blockerId,
            'vendor' => $vendor,
        ]);

        if ($blocker === null) {
            throw new \DomainException('Bloc introuvable.', 404);
        }

        $this->entityManager->remove($blocker);
        $this->entityManager->flush();
    }
}
