<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Onboarding;

use App\Builder\Vendor\Onboarding\VendorOnboardingOverviewBuilder;
use App\Controller\Vendor\Onboarding\GetOnboardingStepAction;
use App\DTO\Vendor\Onboarding\Response\OnboardingOverviewResponseDto;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\Vendor\VendorType;
use App\Service\InviteTokenService;
use PHPUnit\Framework\TestCase;

final class GetOnboardingStepActionTest extends TestCase
{
    public function test_invoke_returns_404_when_token_has_no_vendor(): void
    {
        $inviteToken = (new InviteToken())->setPersona(InviteTokenPersona::Vendor);

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn($inviteToken);

        $response = (new GetOnboardingStepAction(
            $service,
            $this->createStub(VendorOnboardingOverviewBuilder::class)
        ))->__invoke('token-123');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun prestataire associé à ce token'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_422_when_vendor_has_no_service(): void
    {
        $inviteToken = (new InviteToken())->setPersona(InviteTokenPersona::Vendor)->setVendor(new Vendor());

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn($inviteToken);

        $response = (new GetOnboardingStepAction(
            $service,
            $this->createStub(VendorOnboardingOverviewBuilder::class)
        ))->__invoke('token-123');

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun service n\'a été associé à ce prestataire'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_overview_payload(): void
    {
        $vendor = $this->vendorWithService();
        $inviteToken = (new InviteToken())->setPersona(InviteTokenPersona::Vendor)->setVendor($vendor);

        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->with('token-123')->willReturn($inviteToken);

        $overview = new OnboardingOverviewResponseDto('Camille', 'freelance', [], ['professions' => []]);
        $builder = $this->createMock(VendorOnboardingOverviewBuilder::class);
        $builder->expects($this->once())->method('build')->with($vendor)->willReturn($overview);

        $response = (new GetOnboardingStepAction($service, $builder))->__invoke('token-123');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            ['firstname' => 'Camille', 'vendor_type' => 'freelance', 'steps' => [], 'steps_data' => ['professions' => []]],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_domain_exception_response(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willThrowException(new \DomainException('Token invalide', 404));

        $response = (new GetOnboardingStepAction(
            $service,
            $this->createStub(VendorOnboardingOverviewBuilder::class)
        ))->__invoke('token-123');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(['error' => 'Token invalide'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    private function vendorWithService(): Vendor
    {
        $service = (new Service())->setName('Photographe')->setSlug('photographe')->setSortOrder(1)->setCategory(VendorType::Freelance);

        return (new Vendor())->setUser((new User())->setFirstName('Camille')->setEmail('camille@example.com'))->addService($service);
    }
}
