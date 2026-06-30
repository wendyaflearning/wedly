<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Consent;

use App\Controller\Vendor\Consent\PostVendorConsentAction;
use App\DTO\Vendor\VendorProfileStepRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorConsent;
use App\Enum\Vendor\ConsentType;
use App\Handler\Vendor\Onboarding\ConsentStepHandler;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

final class PostVendorConsentActionTest extends TestCase
{
    public function test_invoke_returns_404_when_vendor_cannot_be_found(): void
    {
        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->once())->method('find')->with('vendor-id')->willReturn(null);

        $response = $this->makeAction(vendorRepository: $repository)->__invoke(
            'vendor-id',
            new VendorProfileStepRequestDto(['granted' => true])
        );

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Vendor not found.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_403_when_authenticated_user_does_not_own_vendor(): void
    {
        $vendor = (new Vendor())->setUser(new User());

        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn(new User());

        $response = $this->makeAction(security: $security, vendorRepository: $repository)->__invoke(
            'vendor-id',
            new VendorProfileStepRequestDto(['granted' => true])
        );

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Access denied.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_422_when_handler_rejects_payload(): void
    {
        $user = new User();
        $vendor = (new Vendor())->setUser($user);

        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $handler = $this->createMock(ConsentStepHandler::class);
        $handler->expects($this->once())
            ->method('record')
            ->with($vendor, ['granted' => 'yes'])
            ->willThrowException(new \DomainException('Invalid consent.', 422));

        $response = $this->makeAction($security, $repository, $handler)->__invoke(
            'vendor-id',
            new VendorProfileStepRequestDto(['granted' => 'yes'])
        );

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Invalid consent.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_records_consent_flushes_and_returns_created_payload(): void
    {
        $user = new User();
        $vendor = (new Vendor())->setUser($user);
        $consent = new VendorConsent($vendor, ConsentType::SensitiveData, true);

        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $handler = $this->createMock(ConsentStepHandler::class);
        $handler->expects($this->once())->method('record')->with($vendor, ['granted' => true])->willReturn($consent);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $response = $this->makeAction($security, $repository, $handler, $em)->__invoke(
            'vendor-id',
            new VendorProfileStepRequestDto(['granted' => true])
        );

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(
            ['granted' => true],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    private function makeAction(
        ?Security $security = null,
        ?VendorRepository $vendorRepository = null,
        ?ConsentStepHandler $handler = null,
        ?EntityManagerInterface $em = null,
    ): PostVendorConsentAction {
        return new PostVendorConsentAction(
            $security ?? $this->createStub(Security::class),
            $vendorRepository ?? $this->createStub(VendorRepository::class),
            $handler ?? $this->createStub(ConsentStepHandler::class),
            $em ?? $this->createStub(EntityManagerInterface::class),
        );
    }
}
