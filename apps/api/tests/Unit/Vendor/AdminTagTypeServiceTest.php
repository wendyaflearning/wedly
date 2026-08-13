<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Admin\Vendor\TagType\CreateTagTypeRequestDto;
use App\DTO\Admin\Vendor\TagType\UpdateTagTypeRequestDto;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Repository\Vendor\TagTypeRepository;
use App\Service\Vendor\AdminTagTypeService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class AdminTagTypeServiceTest extends TestCase
{
    public function test_create_persists_tag_type_and_returns_it(): void
    {
        $service = $this->makeService();

        $tagTypeRepository = $this->createMock(TagTypeRepository::class);
        $tagTypeRepository->expects($this->never())->method('findOneActivePrimaryByService');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->with(Service::class, 'service-id')->willReturn($service);
        $em->expects($this->once())->method('persist')->with($this->isInstanceOf(TagType::class));
        $em->expects($this->once())->method('flush');

        $dto = new CreateTagTypeRequestDto(
            serviceId: 'service-id',
            label: 'Spécialités',
            isPrimary: false,
            maxSelections: 3,
        );

        $tagType = (new AdminTagTypeService($em, $tagTypeRepository))->create($dto);

        self::assertSame('Spécialités', $tagType->getLabel());
        self::assertFalse($tagType->isPrimary());
        self::assertSame(3, $tagType->getMaxSelections());
        self::assertSame($service, $tagType->getService());
    }

    public function test_create_throws_404_when_service_not_found(): void
    {
        $tagTypeRepository = $this->createStub(TagTypeRepository::class);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn(null);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagTypeRequestDto('missing-service', 'Ambiance', false, null);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagTypeService($em, $tagTypeRepository))->create($dto);
    }

    public function test_create_throws_422_when_active_primary_already_exists(): void
    {
        $service = $this->makeService();
        $existingPrimary = $this->makeTagType($service, isPrimary: true);

        $tagTypeRepository = $this->createStub(TagTypeRepository::class);
        $tagTypeRepository->method('findOneActivePrimaryByService')->willReturn($existingPrimary);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn($service);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagTypeRequestDto('service-id', 'Spécialités', true, null);

        try {
            (new AdminTagTypeService($em, $tagTypeRepository))->create($dto);
            self::fail('Expected DomainException');
        } catch (\DomainException $exception) {
            self::assertSame(422, $exception->getCode());
            self::assertSame(
                "Une catégorie principale existe déjà pour ce métier. Désactive-la d'abord ou décoche.",
                $exception->getMessage(),
            );
        }
    }

    public function test_update_applies_only_provided_fields(): void
    {
        $tagType = $this->makeTagType($this->makeService(), isPrimary: false, maxSelections: 2);

        $tagTypeRepository = $this->createStub(TagTypeRepository::class);
        $tagTypeRepository->method('find')->willReturn($tagType);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $dto = new UpdateTagTypeRequestDto(label: 'Nouveau label', maxSelections: null);

        $updated = (new AdminTagTypeService($em, $tagTypeRepository))->update('tag-type-id', $dto);

        self::assertSame('Nouveau label', $updated->getLabel());
        self::assertSame(2, $updated->getMaxSelections(), 'maxSelections non fourni ne doit pas être écrasé');
    }

    public function test_update_throws_404_when_not_found(): void
    {
        $tagTypeRepository = $this->createStub(TagTypeRepository::class);
        $tagTypeRepository->method('find')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $dto = new UpdateTagTypeRequestDto(label: 'X', maxSelections: null);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagTypeService($em, $tagTypeRepository))->update('missing', $dto);
    }

    public function test_deactivate_is_idempotent_and_does_not_touch_tag_values(): void
    {
        $tagType = $this->makeTagType($this->makeService(), isPrimary: false);
        self::assertTrue($tagType->isActive());

        $tagTypeRepository = $this->createStub(TagTypeRepository::class);
        $tagTypeRepository->method('find')->willReturn($tagType);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $service = new AdminTagTypeService($em, $tagTypeRepository);

        $result = $service->deactivate('tag-type-id');
        self::assertFalse($result->isActive());
        self::assertCount(0, $result->getTagValues());

        // Deuxième appel : idempotent, aucun flush supplémentaire attendu (mock configuré pour exactement 1).
        $service->deactivate('tag-type-id');
    }

    private function makeService(): Service
    {
        $service = new Service();
        $this->setPrivateProperty($service, 'id', new UuidV7());

        return $service;
    }

    private function makeTagType(Service $service, bool $isPrimary, ?int $maxSelections = null): TagType
    {
        $tagType = (new TagType())
            ->setService($service)
            ->setLabel('Existant')
            ->setIsPrimary($isPrimary)
            ->setMaxSelections($maxSelections);
        $this->setPrivateProperty($tagType, 'id', new UuidV7());

        return $tagType;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflection = new \ReflectionProperty($object, $property);
        $reflection->setAccessible(true);
        $reflection->setValue($object, $value);
    }
}
