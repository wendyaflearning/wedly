<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Vendor\CreateServiceInputDto;
use App\Entity\Vendor\Service;
use App\Exception\ValidationException;
use App\Repository\Vendor\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;

readonly class AdminVendorService
{
    public function __construct(
        private ServiceRepository $serviceRepository,
        private EntityManagerInterface $em,
        private SluggerInterface $slugger,
    ) {}

    public function create(CreateServiceInputDto $dto): Service
    {
        $parent = null;

        if ($dto->parentId !== null) {
            $parent = $this->serviceRepository->find($dto->parentId);

            if ($parent === null) {
                throw new ValidationException([[
                    'field'   => 'parentId',
                    'message' => 'Service parent introuvable.',
                ]]);
            }
        }

        $slug = $this->slugger->slug($dto->name)->lower()->toString();

        if ($this->serviceRepository->findOneBy(['slug' => $slug]) !== null) {
            throw new \DomainException(sprintf('Un service avec le slug "%s" existe déjà.', $slug), 409);
        }

        $sortOrder = $dto->sortOrder ?? (($this->serviceRepository->findMaxSortOrder() ?? 0) + 1);

        $service = (new Service())
            ->setName($dto->name)
            ->setSlug($slug)
            ->setSortOrder($sortOrder)
            ->setCategory($dto->category)
            ->setParent($parent);

        $this->em->persist($service);
        $this->em->flush();

        return $service;
    }
}
