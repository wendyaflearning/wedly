<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\DTO\Admin\Vendor\AdminVendorDraftResponseDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\User\Role;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VenueType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class AdminVendorDraftService
{
    public const DRAFT_EMAIL_DOMAIN = 'admin-draft.wedly.invalid';

    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private InviteTokenRepository $inviteTokenRepository,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function create(AdminVendorDraftRequestDto $dto): AdminVendorDraftResponseDto
    {
        $this->assertEmailAvailable($dto->email);

        $this->em->beginTransaction();
        try {
            $user = new User();
            $user->setFirstName('')
                ->setLastName($dto->lastName)
                ->setEmail($this->generateDraftEmail())
                ->setRoles([Role::Vendor->value])
                ->setPassword($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32))));

            $vendor = new Vendor();
            $vendor->setUser($user)
                ->setBrandName('')
                ->setPriceType(PriceType::PerService)
                ->setPriceMinCents(-1)
                ->setPriceMaxCents(-1)
                ->setStatus(VendorStatus::Pending);

            $this->applyDraft($vendor, $dto);

            $this->em->persist($user);
            $this->em->persist($vendor);
            $this->em->flush();
            $this->em->commit();
        } catch (\Throwable $throwable) {
            $this->em->rollback();
            throw $throwable;
        }

        return new AdminVendorDraftResponseDto($vendor);
    }

    public function get(Vendor $vendor): AdminVendorDraftResponseDto
    {
        return new AdminVendorDraftResponseDto($vendor, $this->inviteTokenRepository->findLatestVendorInvitation($vendor));
    }

    public function update(Vendor $vendor, AdminVendorDraftRequestDto $dto): AdminVendorDraftResponseDto
    {
        $this->assertEditable($vendor);
        if ($dto->emailProvided && $dto->email !== null && $dto->email !== $vendor->getUser()->getEmail()) {
            $this->assertEmailAvailable($dto->email);
        }

        $this->applyDraft($vendor, $dto);
        $this->em->flush();

        return $this->get($vendor);
    }

    public function delete(Vendor $vendor): void
    {
        $this->assertDeletable($vendor);

        $this->em->beginTransaction();
        try {
            $user = $vendor->getUser();
            $this->em->remove($vendor);
            $this->em->remove($user);
            $this->em->flush();
            $this->em->commit();
        } catch (\Throwable $throwable) {
            $this->em->rollback();
            throw $throwable;
        }
    }

    private function applyDraft(Vendor $vendor, AdminVendorDraftRequestDto $dto): void
    {
        if ($dto->firstnameProvided) {
            $vendor->getUser()->setFirstName($dto->firstname ?? '');
        }
        if ($dto->lastNameProvided) {
            $vendor->getUser()->setLastName($dto->lastName);
        }
        if ($dto->emailProvided) {
            $vendor->getUser()->setEmail($dto->email ?? $this->generateDraftEmail());
        }
        if ($dto->brandNameProvided) {
            $vendor->setBrandName($dto->brandName ?? '');
        }
        if ($dto->serviceIdProvided) {
            $vendor->getServices()->clear();
            if ($dto->serviceId !== null) {
                $service = $this->em->find(Service::class, $dto->serviceId);
                if ($service === null) {
                    throw new \DomainException('Service introuvable.', 404);
                }
                $vendor->addService($service);
            }
        }
        if ($dto->regionsProvided) {
            $vendor->syncZones($this->resolveEntities(Region::class, $dto->regions ?? [], 'Région'));
        }
        if ($dto->priceMinProvided) {
            $vendor->setPriceMinCents($dto->priceMin ?? -1);
        }
        if ($dto->priceMaxProvided) {
            $vendor->setPriceMaxCents($dto->priceMax ?? -1);
        }
        if ($dto->priceTypeProvided) {
            $priceType = $dto->priceType === null ? PriceType::PerService : PriceType::tryFrom($dto->priceType);
            if ($priceType === null) {
                throw new \DomainException('Type de prix invalide.', 422);
            }
            $vendor->setPriceType($priceType);
        }
        $this->assertDraftPriceRange($vendor);

        $this->applyExperiences($vendor, $dto->experiences);
        $this->applyLegalInfo($vendor, $dto->legalInfo);
        $this->applyVenueCharacteristics($vendor, $dto->venueCharacteristics);
        $this->applyCateringCharacteristics($vendor, $dto->cateringCharacteristics);
    }

    private function applyExperiences(Vendor $vendor, ?array $experiences): void
    {
        if ($experiences === null) {
            return;
        }

        if (array_key_exists('culture_ids', $experiences)) {
            $vendor->getCultures()->clear();
            foreach ($this->resolveEntities(Culture::class, $experiences['culture_ids'] ?? [], 'Culture') as $culture) {
                $vendor->addCulture($culture);
            }
        }

        if (array_key_exists('confession_ids', $experiences)) {
            $vendor->getConfessions()->clear();
            foreach ($this->resolveEntities(Confession::class, $experiences['confession_ids'] ?? [], 'Confession') as $confession) {
                $vendor->addConfession($confession);
            }
        }
    }

    private function applyLegalInfo(Vendor $vendor, ?array $legalInfo): void
    {
        if ($legalInfo === null) {
            return;
        }

        if (array_key_exists('phone', $legalInfo)) {
            $vendor->setPhone($this->nullableString($legalInfo['phone']));
        }
        if (array_key_exists('address', $legalInfo)) {
            $vendor->setAddress($this->nullableString($legalInfo['address']));
        }
        if (array_key_exists('zipcode', $legalInfo)) {
            $vendor->setZipcode($this->nullableString($legalInfo['zipcode']));
        }
        if (array_key_exists('city', $legalInfo)) {
            $vendor->setCity($this->nullableString($legalInfo['city']));
        }
        if (array_key_exists('siret', $legalInfo)) {
            $siret = $this->nullableString($legalInfo['siret']);
            if ($siret !== null && !preg_match('/^\d{14}$/', $siret)) {
                throw new \DomainException('SIRET invalide.', 422);
            }
            $vendor->setSiret($siret);
        }
    }

    private function applyVenueCharacteristics(Vendor $vendor, ?array $data): void
    {
        if ($data === null) {
            return;
        }

        $details = $vendor->getVenueDetails();
        if ($details === null) {
            $details = (new VendorVenueDetails())->setVendor($vendor)->setVenueType(VenueType::Autre);
            $vendor->setVenueDetails($details);
            $this->em->persist($details);
        }

        if (array_key_exists('venue_type', $data)) {
            $venueType = VenueType::tryFrom((string) $data['venue_type']);
            if ($venueType === null) {
                throw new \DomainException('Type de lieu invalide.', 422);
            }
            $details->setVenueType($venueType);
        }
        if (array_key_exists('capacity_min', $data)) {
            $details->setCapacityMin($this->nullableInt($data['capacity_min']));
        }
        if (array_key_exists('capacity_max', $data)) {
            $details->setCapacityMax($this->nullableInt($data['capacity_max']));
        }
        if ($details->getCapacityMin() !== null && $details->getCapacityMax() !== null && $details->getCapacityMin() >= $details->getCapacityMax()) {
            throw new \DomainException('capacity_min doit être inférieur à capacity_max.', 422);
        }

        foreach ([
            'has_catering' => 'setHasCatering',
            'has_accommodation' => 'setHasAccommodation',
            'has_outdoor_space' => 'setHasOutdoorSpace',
            'has_corkage_fee' => 'setHasCorkageFee',
            'has_toilets' => 'setHasToilets',
            'is_pmr_accessible' => 'setIsPmrAccessible',
        ] as $field => $setter) {
            if (array_key_exists($field, $data)) {
                $details->{$setter}((bool) $data[$field]);
            }
        }
        if (array_key_exists('nearest_city', $data)) {
            $details->setNearestCity($this->nullableString($data['nearest_city']));
        }
        if (array_key_exists('distance_to_city_minutes', $data)) {
            $details->setDistanceToCityMinutes($this->nullableInt($data['distance_to_city_minutes']));
        }
    }

    private function applyCateringCharacteristics(Vendor $vendor, ?array $data): void
    {
        if ($data === null) {
            return;
        }

        $details = $vendor->getCateringDetails();
        if ($details === null) {
            $details = (new VendorCateringDetails())->setVendor($vendor);
            $vendor->setCateringDetails($details);
            $this->em->persist($details);
        }

        if (array_key_exists('covers_min', $data)) {
            $details->setCoversMin($this->nullableInt($data['covers_min']));
        }
        if (array_key_exists('covers_max', $data)) {
            $details->setCoversMax($this->nullableInt($data['covers_max']));
        }
        if ($details->getCoversMin() !== null && $details->getCoversMax() !== null && $details->getCoversMin() > $details->getCoversMax()) {
            throw new \DomainException('covers_min doit être inférieur à covers_max.', 422);
        }

        foreach ([
            'is_kosher' => 'setIsKosher',
            'is_halal' => 'setIsHalal',
            'is_vegan' => 'setIsVegan',
            'is_gluten_free' => 'setIsGlutenFree',
            'offers_table_service' => 'setOffersTableService',
            'offers_buffet' => 'setOffersBuffet',
            'offers_cocktail' => 'setOffersCocktail',
            'provides_tableware' => 'setProvidesTableware',
            'provides_furniture' => 'setProvidesFurniture',
        ] as $field => $setter) {
            if (array_key_exists($field, $data)) {
                $details->{$setter}((bool) $data[$field]);
            }
        }
    }

    private function assertDraftPriceRange(Vendor $vendor): void
    {
        $priceMin = $vendor->getPriceMinCents();
        $priceMax = $vendor->getPriceMaxCents();
        if ($priceMin >= 0 && $priceMax >= 0 && $priceMin > $priceMax) {
            throw new \DomainException('La fourchette de prix est invalide.', 422);
        }
    }

    private function assertEditable(Vendor $vendor): void
    {
        if ($this->inviteTokenRepository->hasUsedVendorInvitation($vendor)) {
            throw new \DomainException('Invitation déjà utilisée ; le brouillon ne peut plus être modifié.', 409);
        }
    }

    private function assertDeletable(Vendor $vendor): void
    {
        if ($vendor->getStatus() !== VendorStatus::Pending || $this->inviteTokenRepository->hasVendorInvitation($vendor)) {
            throw new \DomainException('Ce brouillon ne peut pas être supprimé.', 409);
        }
    }

    private function assertEmailAvailable(?string $email): void
    {
        if ($email === null) {
            return;
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            throw new \DomainException('Cet email est déjà utilisé.', 409);
        }
    }

    /** @template T of object @param class-string<T> $className @return T[] */
    private function resolveEntities(string $className, array $ids, string $label): array
    {
        $entities = [];
        foreach ($ids as $id) {
            if (!is_string($id)) {
                throw new \DomainException(sprintf('L’identifiant %s doit être une chaîne.', strtolower($label)), 422);
            }

            $entity = $this->em->find($className, $id);
            if ($entity === null) {
                throw new \DomainException(sprintf('%s introuvable : %s.', $label, $id), 422);
            }
            $entities[] = $entity;
        }

        return $entities;
    }

    private function nullableString(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    private function generateDraftEmail(): string
    {
        return sprintf('draft-%s@%s', bin2hex(random_bytes(16)), self::DRAFT_EMAIL_DOMAIN);
    }

}
