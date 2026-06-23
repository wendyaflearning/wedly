<?php

declare(strict_types=1);

namespace App\Tests\Unit\BookingBlocker;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\Vendor\Vendor;
use App\Repository\BookingBlocker\BookingBlockerRepository;
use App\Service\BookingBlocker\BookingBlockerService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

final class BookingBlockerServiceTest extends TestCase
{
    private BookingBlockerRepository&Stub $repository;
    private EntityManagerInterface&MockObject $entityManager;

    protected function setUp(): void
    {
        $this->repository    = $this->createStub(BookingBlockerRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
    }

    private function makeService(): BookingBlockerService
    {
        return new BookingBlockerService($this->repository, $this->entityManager);
    }

    // --- create() ---

    public function test_create_persists_and_returns_blocker_when_no_overlap(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $start  = new \DateTimeImmutable('2026-07-15');
        $end    = new \DateTimeImmutable('2026-07-20');

        $this->repository->method('findOverlapping')->willReturn([]);

        $this->entityManager->expects($this->once())->method('persist')
            ->with($this->isInstanceOf(BookingBlocker::class));
        $this->entityManager->expects($this->once())->method('flush');

        $blocker = $this->makeService()->create($vendor, $start, $end);

        $this->assertSame($vendor, $blocker->getVendor());
        $this->assertSame($start, $blocker->getStartDate());
        $this->assertSame($end, $blocker->getEndDate());
    }

    public function test_create_throws_domain_exception_when_start_is_after_end(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('La date de début doit être antérieure ou égale à la date de fin.');

        $this->makeService()->create($vendor, new \DateTimeImmutable('2026-07-20'), new \DateTimeImmutable('2026-07-15'));
    }

    public function test_create_throws_domain_exception_when_start_is_in_the_past(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('La date de début ne peut pas être dans le passé.');

        $this->makeService()->create($vendor, new \DateTimeImmutable('2025-01-01'), new \DateTimeImmutable('2025-01-10'));
    }

    public function test_create_throws_domain_exception_when_end_exceeds_12_months(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('La date de fin ne peut pas dépasser 12 mois à partir d\'aujourd\'hui.');

        $this->makeService()->create($vendor, new \DateTimeImmutable('2026-07-15'), new \DateTimeImmutable('2028-01-01'));
    }

    public function test_create_throws_domain_exception_when_overlap_exists(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $this->repository->method('findOverlapping')->willReturn([new BookingBlocker()]);

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Ce bloc chevauche une indisponibilité existante.');

        $this->makeService()->create($vendor, new \DateTimeImmutable('2026-07-15'), new \DateTimeImmutable('2026-07-20'));
    }

    // --- delete() ---

    public function test_delete_removes_blocker_when_found_for_vendor(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $blockerId = 'some-uuid';
        $blocker   = new BookingBlocker();

        $this->repository->method('findOneBy')->willReturn($blocker);

        $this->entityManager->expects($this->once())->method('remove')->with($blocker);
        $this->entityManager->expects($this->once())->method('flush');

        $this->makeService()->delete($vendor, $blockerId);
    }

    public function test_delete_throws_domain_exception_when_blocker_not_found(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $this->repository->method('findOneBy')->willReturn(null);

        $this->entityManager->expects($this->never())->method('remove');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Bloc introuvable.');

        $this->makeService()->delete($vendor, 'nonexistent-uuid');
    }

    public function test_delete_throws_domain_exception_when_blocker_belongs_to_other_vendor(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $blockerId = 'some-uuid';

        $this->repository->method('findOneBy')->willReturn(null);

        $this->entityManager->expects($this->never())->method('remove');
        $this->entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Bloc introuvable.');

        $this->makeService()->delete($vendor, $blockerId);
    }
}
