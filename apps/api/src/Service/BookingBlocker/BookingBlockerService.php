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
     * @throws \DomainException
     */
    public function create(Vendor $vendor, \DateTimeImmutable $start, \DateTimeImmutable $end): BookingBlocker
    {
        $today   = new \DateTimeImmutable('today');
        $maxDate = $today->modify('+12 months');

        if ($start > $end) {
            throw new \DomainException('La date de début doit être antérieure ou égale à la date de fin.', 422);
        }

        if ($start < $today) {
            throw new \DomainException('La date de début ne peut pas être dans le passé.', 422);
        }

        if ($end > $maxDate) {
            throw new \DomainException('La date de fin ne peut pas dépasser 12 mois à partir d\'aujourd\'hui.', 422);
        }

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
     * @throws \DomainException
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
