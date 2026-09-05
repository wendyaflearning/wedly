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
use App\Event\ProviderLeadAcceptedEvent;
use App\Event\ProviderLeadRefusedEvent;
use App\Entity\User\User;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\NullLogger;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class DecideVendorProviderLeadServiceTest extends TestCase
{
    private const LEAD_ID = '0198f0a1-0000-7000-8000-000000000001';

    private EntityManagerInterface&MockObject $em;
    private EventDispatcherInterface $eventDispatcher;

    protected function setUp(): void
    {
        $this->em              = $this->createMock(EntityManagerInterface::class);
        $this->eventDispatcher = $this->createStub(EventDispatcherInterface::class);
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

        (new DecideVendorProviderLeadService(
            $this->em,
            $repository,
            $this->eventDispatcher,
            new ProviderLeadCategoryResolver(),
            new NullLogger(),
        ))
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
     * L'acceptation dévoile le prestataire : c'est le seul des deux events qui
     * porte son nom.
     */
    public function testAcceptingNotifiesTheCoupleAndNamesTheVendor(): void
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumière');
        $lead   = $this->pendingLead($vendor);
        $this->em->expects($this->once())->method('flush');

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $this->eventDispatcher = $dispatcher;
        $dispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (object $event): bool {
                self::assertInstanceOf(ProviderLeadAcceptedEvent::class, $event);
                self::assertSame('camille@example.test', $event->coupleEmail);
                self::assertSame('Camille', $event->coupleFirstName);
                self::assertSame('Studio Lumière', $event->vendorBrandName);

                return true;
            }));

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Accept);
    }

    /**
     * Le cœur de la règle : un refus laisse la fiche masquée côté couple, donc
     * l'event qui l'annonce n'a aucune propriété où l'identité du prestataire
     * pourrait voyager. Aucune régression ne peut l'y faire apparaître.
     */
    public function testRefusingNotifiesTheCoupleWithoutNamingTheVendor(): void
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumière');
        $lead   = $this->pendingLead($vendor);
        $this->em->expects($this->once())->method('flush');

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $this->eventDispatcher = $dispatcher;
        $dispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (object $event): bool {
                self::assertInstanceOf(ProviderLeadRefusedEvent::class, $event);

                $values = array_map(strval(...), array_filter(
                    get_object_vars($event),
                    static fn(mixed $value) => is_scalar($value),
                ));

                foreach ($values as $property => $value) {
                    self::assertStringNotContainsStringIgnoringCase('Studio Lumière', $value, sprintf(
                        'La propriété « %s » ne doit pas porter le nom du prestataire.',
                        $property,
                    ));
                }

                self::assertArrayNotHasKey('vendorBrandName', get_object_vars($event));

                return true;
            }));

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Refuse);
    }

    /**
     * Une demande déjà tranchée n'est pas re-notifiée : le couple ne doit pas
     * recevoir deux fois le même mail parce qu'un onglet a été rechargé.
     */
    public function testARefusedDecisionNotifiesNobody(): void
    {
        $vendor = new Vendor();
        $lead   = $this->pendingLead($vendor)->setStatus(ProviderLeadStatus::Accepted);
        $this->em->expects($this->never())->method('flush');

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $this->eventDispatcher = $dispatcher;
        $dispatcher->expects($this->never())->method('dispatch');

        $this->expectException(\DomainException::class);

        $this->serviceFinding($lead)->decide($vendor, self::LEAD_ID, ProviderLeadDecision::Refuse);
    }

    /**
     * Le repository est un stub : ce qu'on teste ici est la décision du service,
     * pas la façon dont il interroge Doctrine.
     */
    private function serviceFinding(?ProviderLead $lead): DecideVendorProviderLeadService
    {
        $repository = $this->createStub(ProviderLeadRepository::class);
        $repository->method('find')->willReturn($lead);

        return new DecideVendorProviderLeadService(
            $this->em,
            $repository,
            $this->eventDispatcher,
            new ProviderLeadCategoryResolver(),
            new NullLogger(),
        );
    }

    private function pendingLead(Vendor $vendor): ProviderLead
    {
        $couple = (new Couple())->setUser(
            (new User())->setFirstName('Camille')->setEmail('camille@example.test'),
        );

        $lead = new ProviderLead($couple, $vendor, 2_350_000);

        (new \ReflectionClass($lead))
            ->getProperty('id')
            ->setValue($lead, UuidV7::fromString(self::LEAD_ID));

        return $lead;
    }
}
