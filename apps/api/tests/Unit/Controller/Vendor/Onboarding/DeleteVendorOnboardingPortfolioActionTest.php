<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Onboarding;

use App\Controller\Vendor\Onboarding\DeleteVendorOnboardingPortfolioAction;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\InviteTokenService;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class DeleteVendorOnboardingPortfolioActionTest extends TestCase
{
    public function test_invoke_returns_422_when_token_has_no_vendor(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn(new InviteToken());

        $response = $this->makeAction($service)->__invoke('token-123', 'image-id');

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun prestataire associé à ce token.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_404_when_image_cannot_be_found(): void
    {
        $vendor = new Vendor();
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn((new InviteToken())->setVendor($vendor));

        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn(null);

        $response = $this->makeAction($service, $repository)->__invoke('token-123', 'image-id');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(['error' => 'Image introuvable.'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    public function test_invoke_deletes_image_flushes_and_destroys_cloudinary_asset(): void
    {
        $vendor = new Vendor();
        $image = new PortfolioImage();
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willReturn((new InviteToken())->setVendor($vendor));

        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->once())->method('findOneBy')->willReturn($image);

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())->method('deletePhoto')->with($image)->willReturn('cloudinary-id');
        $portfolioService->expects($this->once())->method('destroyCloudinaryAsset')->with('cloudinary-id');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $response = $this->makeAction($service, $repository, $em, $portfolioService)->__invoke('token-123', 'image-id');

        $this->assertSame(204, $response->getStatusCode());
    }

    public function test_invoke_returns_domain_exception_response(): void
    {
        $service = $this->createMock(InviteTokenService::class);
        $service->expects($this->once())->method('resolve')->willThrowException(new \DomainException('Token invalide', 404));

        $response = $this->makeAction($service)->__invoke('token-123', 'image-id');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(['error' => 'Token invalide'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    private function makeAction(
        InviteTokenService $inviteTokenService,
        ?PortfolioImageRepository $repository = null,
        ?EntityManagerInterface $em = null,
        ?PortfolioService $portfolioService = null,
    ): DeleteVendorOnboardingPortfolioAction {
        return new DeleteVendorOnboardingPortfolioAction(
            $inviteTokenService,
            $repository ?? $this->createStub(PortfolioImageRepository::class),
            $em ?? $this->createStub(EntityManagerInterface::class),
            $portfolioService ?? $this->createStub(PortfolioService::class),
        );
    }
}
