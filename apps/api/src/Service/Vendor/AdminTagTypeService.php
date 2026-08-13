<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Admin\Vendor\TagType\CreateTagTypeRequestDto;
use App\DTO\Admin\Vendor\TagType\UpdateTagTypeRequestDto;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Repository\Vendor\TagTypeRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class AdminTagTypeService
{
    public function __construct(
        private EntityManagerInterface $em,
        private TagTypeRepository $tagTypeRepository,
    ) {}

    public function create(CreateTagTypeRequestDto $dto): TagType
    {
        $service = $this->em->find(Service::class, $dto->serviceId);
        if ($service === null) {
            throw new \DomainException('Service introuvable.', 404);
        }

        if ($dto->isPrimary && $this->tagTypeRepository->findOneActivePrimaryByService($dto->serviceId) !== null) {
            throw new \DomainException(
                "Une catégorie principale existe déjà pour ce métier. Désactive-la d'abord ou décoche.",
                422,
            );
        }

        $tagType = (new TagType())
            ->setService($service)
            ->setLabel($dto->label)
            ->setIsPrimary($dto->isPrimary)
            ->setMaxSelections($dto->maxSelections);

        $this->em->persist($tagType);
        $this->em->flush();

        return $tagType;
    }

    public function update(string $id, UpdateTagTypeRequestDto $dto): TagType
    {
        $tagType = $this->getOrFail($id);

        if ($dto->label !== null) {
            $tagType->setLabel($dto->label);
        }

        if ($dto->maxSelections !== null) {
            $tagType->setMaxSelections($dto->maxSelections);
        }

        $this->em->flush();

        return $tagType;
    }

    /**
     * @return TagType[]
     */
    public function listWithValues(string $serviceId): array
    {
        if ($this->em->find(Service::class, $serviceId) === null) {
            throw new \DomainException('Service introuvable.', 404);
        }

        return $this->tagTypeRepository->findAllByServiceIdWithValues($serviceId);
    }

    public function deactivate(string $id): TagType
    {
        $tagType = $this->getOrFail($id);

        // Idempotent : un TagType déjà inactif ne déclenche pas d'erreur ni d'écriture.
        // Les TagValue enfants ne sont volontairement pas désactivés en cascade (hors scope US2).
        if ($tagType->isActive()) {
            $tagType->setIsActive(false);
            $this->em->flush();
        }

        return $tagType;
    }

    private function getOrFail(string $id): TagType
    {
        $tagType = $this->tagTypeRepository->find($id);
        if ($tagType === null) {
            throw new \DomainException('Catégorie de tag introuvable.', 404);
        }

        return $tagType;
    }
}
