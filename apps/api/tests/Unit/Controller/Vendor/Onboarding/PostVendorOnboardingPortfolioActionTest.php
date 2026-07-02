<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Onboarding;

use App\Controller\Vendor\Onboarding\PostVendorOnboardingPortfolioAction;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Service\InviteTokenService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PostVendorOnboardingPortfolioActionTest extends TestCase
{
    public function test_invoke_returns_422_when_token_has_no_vendor(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn(new InviteToken());

        $response = (new PostVendorOnboardingPortfolioAction(
            $service,
            $this->createStub(PortfolioStepHandler::class),
            $this->createStub(ValidatorInterface::class)
        ))->__invoke('token-123', new Request());

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun prestataire associé à ce token'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_validation_errors(): void
    {
        $vendor = new Vendor();
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn((new InviteToken())->setVendor($vendor));

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->expects($this->once())->method('validate')->willReturn(new ConstraintViolationList([
            new ConstraintViolation('Invalid image.', null, [], null, 'coverPhoto', null),
        ]));

        $response = (new PostVendorOnboardingPortfolioAction(
            $service,
            $this->createStub(PortfolioStepHandler::class),
            $validator
        ))->__invoke('token-123', new Request());

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['errors' => ['coverPhoto: Invalid image.']],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_uploads_portfolio_and_returns_images(): void
    {
        $vendor = new Vendor();
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->with('token-123')->willReturn((new InviteToken())->setVendor($vendor));

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->expects($this->once())->method('validate')->willReturn(new ConstraintViolationList());

        $handler = $this->createMock(PortfolioStepHandler::class);
        $handler->expects($this->once())->method('upload')->with($vendor, $this->anything());
        $handler->expects($this->once())->method('getStepData')->with($vendor)->willReturn([
            'images' => [['url' => 'https://example.com/photo.jpg']],
        ]);

        $response = (new PostVendorOnboardingPortfolioAction($service, $handler, $validator))
            ->__invoke('token-123', new Request());

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            ['images' => [['url' => 'https://example.com/photo.jpg']]],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_domain_exception_response(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willThrowException(new \DomainException('Token invalide', 404));

        $response = (new PostVendorOnboardingPortfolioAction(
            $service,
            $this->createStub(PortfolioStepHandler::class),
            $this->createStub(ValidatorInterface::class)
        ))->__invoke('token-123', new Request());

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(['error' => 'Token invalide'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }
}
