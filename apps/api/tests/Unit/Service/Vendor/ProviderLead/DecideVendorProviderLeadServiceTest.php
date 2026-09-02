<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Vendor\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadDecision;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Repository\ProviderLead\ProviderLeadRepository;
use App\Service\Vendor\ProviderLead\DecideVendorProviderLeadService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class DecideVendorProviderLeadServiceTest extends TestCase
{
    private const LEAD_ID = '0198f0a1-0000-7000-8000-000000000001';

    private EntityManagerInterface&MockObject $em;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
    }

    public function testAcceptingPutsTheLeadInAccepted(): void
    {
        $vendor = new Vendor();
        $lead   = $this->pendingLead($vendor);
        $this->em->expects($this->once())->method('flush');

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Accept);

        self::assertSame(ProviderLeadStatus::Accepted, $lead->getStatus());
    }

    public function testRefusingPutsTheLeadInRefused(): void
    {
        $vendor = new Vendor();
        $lead   = $this->pendingLead($vendor);
        $this->em->expects($this->once())->method('flush');

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Refuse);

        self::assertSame(ProviderLeadStatus::Refused, $lead->getStatus());
    }

    /**
     * Le service écrit lui-même, l'Action ne flushe jamais (ADR-006).
     */
    public function testTheServiceFlushesItself(): void
    {
        $vendor = new Vendor();
        $this->em->expects($this->once())->method('flush');

        $this->serviceFinding($this->pendingLead($vendor))
            ->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Accept);
    }

    public function testAnUnknownLeadIsA404(): void
    {
        $this->em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        $this->serviceFinding(null)->decide(new Vendor(), self::LEAD_ID, ProviderLeadDecision::Accept);
    }

    /**
     * Un 403 distinct confirmerait à un prestataire l'existence de la demande
     * d'un confrère : même code et même message que « introuvable ».
     */
    public function testAnotherVendorsLeadIsA404WithTheSameMessage(): void
    {
        $lead = $this->pendingLead(new Vendor());
        $this->em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Demande introuvable.');

        $this->serviceFinding($lead)->decide(new Vendor(), self::LEAD_ID, ProviderLeadDecision::Accept);
    }

    /**
     * Un identifiant non-UUID part en erreur de conversion Doctrine, donc en 500,
     * là où l'utilisateur a juste tapé une URL fausse.
     */
    public function testAMalformedIdIsA404NotACrash(): void
    {
        $repository = $this->createMock(ProviderLeadRepository::class);
        $repository->expects($this->never())->method('find');
        $this->em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new DecideVendorProviderLeadService($this->em, $repository))
            ->decide(new Vendor(), 'pas-un-uuid', ProviderLeadDecision::Accept);
    }

    /**
     * Pas de re-décision silencieuse : rouvrir un vieil email et cliquer
     * « accepter » sur une demande refusée doit dire qu'elle est close.
     */
    public function testDecidingTwiceIsA409(): void
    {
        $vendor = new Vendor();
        $lead   = $this->pendingLead($vendor)->setStatus(ProviderLeadStatus::Refused);
        $this->em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Accept);
    }

    /**
     * Le 409 vaut pour tout statut qui n'est pas « en attente », pas seulement
     * pour les deux décisions : un lead historique n'est pas à reprendre.
     */
    public function testNoStatusOtherThanPendingCanBeDecided(): void
    {
        $vendor = new Vendor();
        $this->em->expects($this->never())->method('flush');

        foreach (ProviderLeadStatus::cases() as $status) {
            if ($status === ProviderLeadStatus::Pending) {
                continue;
            }

            $lead = $this->pendingLead($vendor)->setStatus($status);

            try {
                $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Accept);
                self::fail(sprintf('Le statut « %s » ne devrait pas pouvoir être re-décidé.', $status->value));
            } catch (\DomainException $exception) {
                self::assertSame(409, $exception->getCode(), sprintf('Statut « %s »', $status->value));
            }
        }
    }

    /**
     * Le repository est un stub : ce qu'on teste ici est la décision du service,
     * pas la façon dont il interroge Doctrine.
     */
    private function serviceFinding(?ProviderLead $lead): DecideVendorProviderLeadService
    {
        $repository = $this->createStub(ProviderLeadRepository::class);
        $repository->method('find')->willReturn($lead);

        return new DecideVendorProviderLeadService($this->em, $repository);
    }

    private function pendingLead(Vendor $vendor): ProviderLead
    {
        $lead = new ProviderLead(new Couple(), $vendor, 2_350_000);

        (new \ReflectionClass($lead))
            ->getProperty('id')
            ->setValue($lead, UuidV7::fromString(self::LEAD_ID));

        return $lead;
    }
}
