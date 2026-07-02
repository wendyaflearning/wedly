<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Onboarding;

use App\Controller\Onboarding\ResolveInviteTokenAction;
use App\Entity\Couple\Couple;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\CoupleStatus;
use App\Enum\User\InviteTokenPersona;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\Zone;
use App\Enum\Wedding\Ambiance;
use App\Enum\Wedding\CeremonyType;
use App\Service\InviteTokenService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class ResolveInviteTokenActionTest extends TestCase
{
    public function test_invoke_returns_vendor_invite_payload(): void
    {
        $inviteToken = (new InviteToken())
            ->setPersona(InviteTokenPersona::Vendor)
            ->setVendor($this->vendor());

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->with('token-123')->willReturn($inviteToken);

        $response = (new ResolveInviteTokenAction($service))->__invoke('token-123');

        $this->assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('vendor', $payload['type']);
        $this->assertSame('Studio Lumiere', $payload['data']['brand_name']);
    }

    public function test_invoke_returns_422_when_vendor_token_has_no_vendor(): void
    {
        $inviteToken = (new InviteToken())->setPersona(InviteTokenPersona::Vendor);

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn($inviteToken);

        $response = (new ResolveInviteTokenAction($service))->__invoke('token-123');

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun prestataire associé à ce token'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_couple_invite_payload(): void
    {
        $inviteToken = (new InviteToken())
            ->setPersona(InviteTokenPersona::Couple)
            ->setCouple($this->couple());

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->with('token-123')->willReturn($inviteToken);

        $response = (new ResolveInviteTokenAction($service))->__invoke('token-123');

        $this->assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('couple', $payload['type']);
        $this->assertSame('Alex', $payload['data']['firstname']);
        $this->assertSame('2027-05-12', $payload['data']['wedding']['date']);
    }

    public function test_invoke_returns_422_when_couple_token_has_no_couple(): void
    {
        $inviteToken = (new InviteToken())->setPersona(InviteTokenPersona::Couple);

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn($inviteToken);

        $response = (new ResolveInviteTokenAction($service))->__invoke('token-123');

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun couple associé à ce token'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_domain_exception_response(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())
            ->method('resolve')
            ->with('invalid-token')
            ->willThrowException(new \DomainException('Token invalide', 404));

        $response = (new ResolveInviteTokenAction($service))->__invoke('invalid-token');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Token invalide'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    private function vendor(): Vendor
    {
        $user = (new User())->setFirstName('Camille')->setEmail('camille@example.com');
        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Lumiere')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(120000)
            ->setPriceMaxCents(250000);

        $id = new \ReflectionProperty(Vendor::class, 'id');
        $id->setValue($vendor, new UuidV7());

        return $vendor;
    }

    private function couple(): Couple
    {
        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('2027-05-12'))
            ->setBudgetCents(2500000)
            ->setLocation('Paris')
            ->setZone(Zone::Idf)
            ->setGuestCount(120)
            ->setAmbiance(Ambiance::ElegantSoigne)
            ->setCeremonyType(CeremonyType::Laique);

        $couple = (new Couple())
            ->setUser((new User())->setFirstName('Alex')->setEmail('alex@example.com'))
            ->setWedding($wedding)
            ->setStatus(CoupleStatus::Active);

        $id = new \ReflectionProperty(Couple::class, 'id');
        $id->setValue($couple, new UuidV7());

        return $couple;
    }
}
