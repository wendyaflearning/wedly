<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\DTO\Admin\Vendor\AdminVendorDraftResponseDto;
use App\DTO\Admin\Vendor\AdminVendorInvitationSendResponseDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\User\Role;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VenueType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class AdminVendorDraftService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private InviteTokenRepository $inviteTokenRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    public function create(AdminVendorDraftRequestDto $dto): AdminVendorDraftResponseDto
    {
        $this->assertRequiredFields($dto);
        $this->assertEmailAvailable($dto->email);

        $this->em->beginTransaction();
        try {
            $user = new User();
            $user->setFirstName($dto->firstname)
                ->setLastName($dto->lastName)
                ->setEmail($dto->email)
                ->setRoles([Role::Vendor->value])
                ->setPassword($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32))));

            $vendor = new Vendor();
            $vendor->setUser($user)
                ->setStatus(VendorStatus::Pending);

            $this->applyDraft($vendor, $dto, requireCoreFields: true);

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
        if ($dto->email !== null && $dto->email !== $vendor->getUser()->getEmail()) {
            $this->assertEmailAvailable($dto->email);
        }

        $this->applyDraft($vendor, $dto, requireCoreFields: false);
        $this->em->flush();

        return $this->get($vendor);
    }

    public function sendInvitation(Vendor $vendor, User $adminUser): AdminVendorInvitationSendResponseDto
    {
        $this->assertEditable($vendor);
        $this->assertVendorReadyForInvitation($vendor);

        $now = new \DateTimeImmutable();
        $inviteToken = $this->inviteTokenRepository->findActiveVendorInvitation($vendor, $now);
        if ($inviteToken === null) {
            $inviteToken = (new InviteToken())
                ->setToken(bin2hex(random_bytes(64)))
                ->setCreatedBy($adminUser)
                ->setPersona(InviteTokenPersona::Vendor)
                ->setStatus(InviteTokenStatus::Pending)
                ->setUser($vendor->getUser())
                ->setVendor($vendor)
                ->setExpiresAt($now->modify('+30 days'));

            $this->em->persist($inviteToken);
            $this->em->flush();
        }

        $emailSent = $this->sendInvitationEmail($vendor, $inviteToken);

        return new AdminVendorInvitationSendResponseDto($vendor, $inviteToken, $this->frontendUrl, $emailSent);
    }

    private function applyDraft(Vendor $vendor, AdminVendorDraftRequestDto $dto, bool $requireCoreFields): void
    {
        if ($requireCoreFields) {
            $this->assertRequiredFields($dto);
        }

        if ($dto->firstname !== null) {
            $vendor->getUser()->setFirstName($dto->firstname);
        }
        if ($dto->lastName !== null) {
            $vendor->getUser()->setLastName($dto->lastName);
        }
        if ($dto->email !== null) {
            $vendor->getUser()->setEmail($dto->email);
        }
        if ($dto->brandName !== null) {
            $vendor->setBrandName($dto->brandName);
        }
        if ($dto->serviceId !== null) {
            $service = $this->em->find(Service::class, $dto->serviceId);
            if ($service === null) {
                throw new \DomainException('Service not found.', 404);
            }
            $vendor->getServices()->clear();
            $vendor->addService($service);
        }
        if ($dto->regions !== null) {
            $vendor->syncZones($this->resolveEntities(Region::class, $dto->regions, 'Region'));
        }
        if ($dto->priceMin !== null) {
            $vendor->setPriceMinCents($dto->priceMin);
        }
        if ($dto->priceMax !== null) {
            $vendor->setPriceMaxCents($dto->priceMax);
        }
        if ($dto->priceType !== null) {
            $priceType = PriceType::tryFrom($dto->priceType);
            if ($priceType === null) {
                throw new \DomainException('Invalid price type.', 422);
            }
            $vendor->setPriceType($priceType);
        }

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
                throw new \DomainException('Invalid SIRET.', 422);
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
                throw new \DomainException('Invalid venue type.', 422);
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

    private function assertRequiredFields(AdminVendorDraftRequestDto $dto): void
    {
        if ($dto->firstname === null || $dto->email === null || $dto->brandName === null || $dto->serviceId === null) {
            throw new \DomainException('Missing required identity or profession fields.', 422);
        }
        if ($dto->regions === null || count($dto->regions) === 0 || $dto->priceMin === null || $dto->priceMax === null || $dto->priceType === null) {
            throw new \DomainException('Missing required pricing fields.', 422);
        }
        if ($dto->priceMin < 0 || $dto->priceMax < 0 || $dto->priceMin > $dto->priceMax) {
            throw new \DomainException('Invalid price range.', 422);
        }
        if (!filter_var($dto->email, FILTER_VALIDATE_EMAIL)) {
            throw new \DomainException('Invalid email.', 422);
        }
    }

    private function assertVendorReadyForInvitation(Vendor $vendor): void
    {
        if ($vendor->getUser()->getFirstName() === '' || $vendor->getUser()->getEmail() === '' || $vendor->getBrandName() === '') {
            throw new \DomainException('Missing required identity fields.', 422);
        }
        if ($vendor->getServices()->isEmpty() || $vendor->getRegions()->isEmpty()) {
            throw new \DomainException('Missing required profession or region fields.', 422);
        }
        if ($vendor->getPriceMinCents() < 0 || $vendor->getPriceMaxCents() < 0 || $vendor->getPriceMinCents() > $vendor->getPriceMaxCents()) {
            throw new \DomainException('Invalid price range.', 422);
        }
    }

    private function assertEditable(Vendor $vendor): void
    {
        if ($this->inviteTokenRepository->hasUsedVendorInvitation($vendor)) {
            throw new \DomainException('Invitation already used; vendor draft can no longer be edited.', 409);
        }
    }

    private function assertEmailAvailable(?string $email): void
    {
        if ($email === null) {
            return;
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            throw new \DomainException('Email already registered.', 409);
        }
    }

    /** @template T of object @param class-string<T> $className @return T[] */
    private function resolveEntities(string $className, array $ids, string $label): array
    {
        $entities = [];
        foreach ($ids as $id) {
            if (!is_string($id)) {
                throw new \DomainException(sprintf('%s id must be a string.', $label), 422);
            }

            $entity = $this->em->find($className, $id);
            if ($entity === null) {
                throw new \DomainException(sprintf('%s not found: %s.', $label, $id), 422);
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

    private function sendInvitationEmail(Vendor $vendor, InviteToken $inviteToken): bool
    {
        try {
            $email = (new TemplatedEmail())
                ->from(new Address('bonjour@wedly.fr', 'Wedly'))
                ->to($vendor->getUser()->getEmail())
                ->subject('Complétez votre profil Wedly')
                ->htmlTemplate('emails/vendor/vendor_admin_invitation.html.twig')
                ->context([
                    'firstName'     => $vendor->getUser()->getFirstName(),
                    'brandName'     => $vendor->getBrandName(),
                    'invitationUrl' => rtrim($this->frontendUrl, '/') . '/onboarding/' . $inviteToken->getToken(),
                    'expiresAt'     => $inviteToken->getExpiresAt(),
                ]);

            $this->mailer->send($email);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
