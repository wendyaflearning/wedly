<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Admin\Vendor\TagValue\CreateTagValueRequestDto;
use App\DTO\Admin\Vendor\TagValue\UpdateTagValueRequestDto;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\TagValueRepository;
use App\Service\Vendor\AdminTagValueService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class AdminTagValueServiceTest extends TestCase
{
    public function test_create_persists_tag_value_and_returns_it(): void
    {
        $tagType = $this->makeTagType();

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->with(TagType::class, 'tag-type-id')->willReturn($tagType);
        $em->expects($this->once())->method('persist')->with($this->isInstanceOf(TagValue::class));
        $em->expects($this->once())->method('flush');

        $dto = new CreateTagValueRequestDto(tagTypeId: 'tag-type-id', label: 'DJ + coordination soirée');

        $tagValue = (new AdminTagValueService($em, $tagValueRepository))->create($dto);

        self::assertSame('DJ + coordination soirée', $tagValue->getLabel());
        self::assertSame($tagType, $tagValue->getTagType());
    }

    public function test_create_throws_404_when_tag_type_not_found(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn(null);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagValueRequestDto('missing-tag-type', 'Fleuriste');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagValueService($em, $tagValueRepository))->create($dto);
    }

    public function test_create_throws_404_when_tag_type_inactive(): void
    {
        $tagType = $this->makeTagType(isActive: false);

        $tagValueRepository = $this->createStub(TagValueRepository::class);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn($tagType);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagValueRequestDto('tag-type-id', 'Fleuriste');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagValueService($em, $tagValueRepository))->create($dto);
    }

    public function test_create_throws_409_when_label_already_exists_for_tag_type(): void
    {
        $tagType = $this->makeTagType();
        $existing = $this->makeTagValue($tagType);

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturn($existing);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn($tagType);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagValueRequestDto('tag-type-id', 'Existant');

        try {
            (new AdminTagValueService($em, $tagValueRepository))->create($dto);
            self::fail('Expected DomainException');
        } catch (\DomainException $exception) {
            self::assertSame(409, $exception->getCode());
            self::assertSame('Ce tag existe déjà pour cette catégorie.', $exception->getMessage());
        }
    }

    public function test_create_throws_409_when_label_differs_only_by_case(): void
    {
        $tagType = $this->makeTagType();
        $existing = $this->makeTagValue($tagType, label: 'Rustique');

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturnCallback(
            static fn (string $tagTypeId, string $label, ?string $excludeId = null): ?TagValue =>
                strcasecmp($existing->getLabel(), $label) === 0 ? $existing : null,
        );

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn($tagType);
        $em->expects($this->never())->method('persist');

        $dto = new CreateTagValueRequestDto('tag-type-id', 'rustique');

        try {
            (new AdminTagValueService($em, $tagValueRepository))->create($dto);
            self::fail('Expected DomainException');
        } catch (\DomainException $exception) {
            self::assertSame(409, $exception->getCode());
            self::assertSame('Ce tag existe déjà pour cette catégorie.', $exception->getMessage());
        }
    }

    public function test_update_applies_label_when_no_duplicate(): void
    {
        $tagValue = $this->makeTagValue($this->makeTagType());

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $dto = new UpdateTagValueRequestDto(label: 'Nouveau label');

        $updated = (new AdminTagValueService($em, $tagValueRepository))->update('tag-value-id', $dto);

        self::assertSame('Nouveau label', $updated->getLabel());
    }

    public function test_update_with_same_label_as_self_does_not_throw(): void
    {
        $tagValue = $this->makeTagValue($this->makeTagType());

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);
        // Le repository exclut déjà l'id courant : pas de doublon détecté.
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $dto = new UpdateTagValueRequestDto(label: 'Existant');

        $updated = (new AdminTagValueService($em, $tagValueRepository))->update('tag-value-id', $dto);

        self::assertSame('Existant', $updated->getLabel());
    }

    public function test_update_throws_409_when_label_collides_with_another_tag_value(): void
    {
        $tagType = $this->makeTagType();
        $tagValue = $this->makeTagValue($tagType);
        $conflicting = $this->makeTagValue($tagType);

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturn($conflicting);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $dto = new UpdateTagValueRequestDto(label: 'Doublon');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        (new AdminTagValueService($em, $tagValueRepository))->update('tag-value-id', $dto);
    }

    public function test_update_throws_409_when_label_differs_only_by_case_from_another_value(): void
    {
        $tagType = $this->makeTagType();
        $tagValue = $this->makeTagValue($tagType, label: 'Existant');
        $conflicting = $this->makeTagValue($tagType, label: 'Rustique');

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);
        $tagValueRepository->method('findOneByLabelAndTagType')->willReturnCallback(
            static fn (string $tagTypeId, string $label, ?string $excludeId = null): ?TagValue =>
                strcasecmp($conflicting->getLabel(), $label) === 0 ? $conflicting : null,
        );

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $dto = new UpdateTagValueRequestDto(label: 'rustique');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        (new AdminTagValueService($em, $tagValueRepository))->update('tag-value-id', $dto);
    }

    public function test_update_throws_404_when_not_found(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $dto = new UpdateTagValueRequestDto(label: 'X');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagValueService($em, $tagValueRepository))->update('missing', $dto);
    }

    public function test_deactivate_is_idempotent(): void
    {
        $tagValue = $this->makeTagValue($this->makeTagType());
        self::assertTrue($tagValue->isActive());

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $service = new AdminTagValueService($em, $tagValueRepository);

        $result = $service->deactivate('tag-value-id');
        self::assertFalse($result->isActive());

        // Deuxième appel : idempotent, aucun flush supplémentaire attendu (mock configuré pour exactement 1).
        $service->deactivate('tag-value-id');
    }

    public function test_activate_reactivates_inactive_tag_value(): void
    {
        $tagValue = $this->makeTagValue($this->makeTagType());
        $tagValue->setIsActive(false);
        self::assertFalse($tagValue->isActive());

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $service = new AdminTagValueService($em, $tagValueRepository);

        $result = $service->activate('tag-value-id');
        self::assertTrue($result->isActive());
    }

    public function test_activate_is_idempotent(): void
    {
        $tagValue = $this->makeTagValue($this->makeTagType());
        self::assertTrue($tagValue->isActive());

        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn($tagValue);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $service = new AdminTagValueService($em, $tagValueRepository);

        $result = $service->activate('tag-value-id');
        self::assertTrue($result->isActive());
    }

    public function test_deactivate_throws_404_when_not_found(): void
    {
        $tagValueRepository = $this->createStub(TagValueRepository::class);
        $tagValueRepository->method('find')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);

        (new AdminTagValueService($em, $tagValueRepository))->deactivate('missing');
    }

    private function makeTagType(bool $isActive = true): TagType
    {
        $service = new \App\Entity\Vendor\Service();
        $this->setPrivateProperty($service, 'id', new UuidV7());

        $tagType = (new TagType())
            ->setService($service)
            ->setLabel('Spécialités')
            ->setIsPrimary(false)
            ->setIsActive($isActive);
        $this->setPrivateProperty($tagType, 'id', new UuidV7());

        return $tagType;
    }

    private function makeTagValue(TagType $tagType, string $label = 'Existant'): TagValue
    {
        $tagValue = (new TagValue())
            ->setTagType($tagType)
            ->setLabel($label);
        $this->setPrivateProperty($tagValue, 'id', new UuidV7());

        return $tagValue;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflection = new \ReflectionProperty($object, $property);
        $reflection->setAccessible(true);
        $reflection->setValue($object, $value);
    }
}
