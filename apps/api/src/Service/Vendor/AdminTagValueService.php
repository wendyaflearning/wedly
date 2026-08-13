<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Admin\Vendor\TagValue\CreateTagValueRequestDto;
use App\DTO\Admin\Vendor\TagValue\UpdateTagValueRequestDto;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\TagValueRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class AdminTagValueService
{
    public function __construct(
        private EntityManagerInterface $em,
        private TagValueRepository $tagValueRepository,
    ) {}

    public function create(CreateTagValueRequestDto $dto): TagValue
    {
        $tagType = $this->em->find(TagType::class, $dto->tagTypeId);
        if ($tagType === null || !$tagType->isActive()) {
            throw new \DomainException('Catégorie de tag introuvable.', 404);
        }

        if ($this->tagValueRepository->findOneByLabelAndTagType($dto->tagTypeId, $dto->label) !== null) {
            throw new \DomainException('Ce tag existe déjà pour cette catégorie.', 409);
        }

        $tagValue = (new TagValue())
            ->setTagType($tagType)
            ->setLabel($dto->label);

        $this->em->persist($tagValue);
        $this->em->flush();

        return $tagValue;
    }

    public function update(string $id, UpdateTagValueRequestDto $dto): TagValue
    {
        $tagValue = $this->getOrFail($id);

        if ($dto->label !== null) {
            $tagTypeId = $tagValue->getTagType()->getId()->toRfc4122();

            if ($this->tagValueRepository->findOneByLabelAndTagType($tagTypeId, $dto->label, $id) !== null) {
                throw new \DomainException('Ce tag existe déjà pour cette catégorie.', 409);
            }

            $tagValue->setLabel($dto->label);
        }

        $this->em->flush();

        return $tagValue;
    }

    public function deactivate(string $id): TagValue
    {
        $tagValue = $this->getOrFail($id);

        // Idempotent : une TagValue déjà inactive ne déclenche pas d'erreur ni d'écriture.
        // Aucune cascade sur portfolio_image_tag : les photos déjà taguées gardent le tag.
        if ($tagValue->isActive()) {
            $tagValue->setIsActive(false);
            $this->em->flush();
        }

        return $tagValue;
    }

    private function getOrFail(string $id): TagValue
    {
        $tagValue = $this->tagValueRepository->find($id);
        if ($tagValue === null) {
            throw new \DomainException('Valeur de tag introuvable.', 404);
        }

        return $tagValue;
    }
}
