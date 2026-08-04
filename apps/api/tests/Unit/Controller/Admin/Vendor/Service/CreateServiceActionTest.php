<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Vendor\Service;

use App\Controller\Admin\Vendor\Service\CreateServiceAction;
use App\DTO\Vendor\CreateServiceInputDto;
use App\Entity\Vendor\Service;
use App\Enum\Vendor\VendorType;
use App\Service\Vendor\AdminVendorService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class CreateServiceActionTest extends TestCase
{
    public function test_invoke_creates_service_and_returns_201(): void
    {
        $service = (new Service())
            ->setName('Violoniste')
            ->setSlug('violoniste')
            ->setSortOrder(107)
            ->setCategory(VendorType::Freelance);

        $id = UuidV7::fromString('019da0ec-d800-7006-8006-000000000099');
        $idReflection = new \ReflectionProperty(Service::class, 'id');
        $idReflection->setAccessible(true);
        $idReflection->setValue($service, $id);

        $dto = new CreateServiceInputDto(
            name: 'Violoniste',
            category: VendorType::Freelance,
            parentId: '019da0ec-d800-7006-8006-000000000002',
        );

        $catalogService = $this->createMock(AdminVendorService::class);
        $catalogService->expects($this->once())
            ->method('create')
            ->with($dto)
            ->willReturn($service);

        $response = (new CreateServiceAction($catalogService))->__invoke($dto);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(
            [
                'id'       => $id->toRfc4122(),
                'name'     => 'Violoniste',
                'slug'     => 'violoniste',
                'category' => 'freelance',
                'children' => [],
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }
}
