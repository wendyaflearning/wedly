<?php

declare(strict_types=1);

namespace App\Service\Couple;

use App\DTO\Couple\RegisterRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use App\Enum\Couple\ConsentType;
use App\Enum\Couple\CoupleStatus;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * The convergence point of the whole couple journey: `User`, `Wedding`, `Couple`,
 * the sensitive-data consent and — when the journey started on a contact request
 * — the `ProviderLead` are written in one transaction, because `Couple.user` and
 * `Couple.wedding` are NOT NULL and none of them can exist alone
 * (COUPLE-ONBOARDING-001).
 */
final readonly class CoupleRegistrationService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
        private VendorRepository $vendorRepository,
    ) {}

    /**
     * @throws \DomainException when the email is taken (409) or the targeted
     *                          vendor cannot receive a lead (422)
     */
    public function register(RegisterRequestDto $dto): User
    {
        if ($this->userRepository->findOneBy(['email' => $dto->email]) !== null) {
            throw new \DomainException('Un compte existe déjà avec cette adresse email.', 409);
        }

        $vendor = $dto->vendorId === null ? null : $this->activeVendor($dto->vendorId);

        return $this->em->wrapInTransaction(function () use ($dto, $vendor): User {
            $user = $this->createUser($dto);
            $wedding = $this->createWedding($dto);
            $couple = (new Couple())
                ->setUser($user)
                ->setWedding($wedding)
                ->setPlanningStage($dto->planningStage())
                ->setStatus(CoupleStatus::Active);

            $this->em->persist($user);
            $this->em->persist($wedding);
            $this->em->persist($couple);

            // The consent is recorded whichever way the couple answered: a refusal
            // is a decision to keep, not an absence of one (RGPD-CONSENT-001), and
            // it is the same transaction that leaves the sensitive collections
            // empty (RGPD-CONSENT-006).
            $this->em->persist(new WeddingConsent($wedding, ConsentType::SensitiveData, $dto->sensitiveDataConsent));

            if ($vendor !== null) {
                $this->em->persist(new ProviderLead($couple, $vendor, $wedding->getBudgetCents()));
            }

            return $user;
        });
    }

    private function createUser(RegisterRequestDto $dto): User
    {
        $user = (new User())
            ->setEmail($dto->email)
            ->setFirstName($dto->firstName)
            // A couple owns its account from the first second: nothing is reviewed
            // on its side, unlike a vendor waiting for admin validation.
            ->setStatus(UserStatus::Active);

        return $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));
    }

    private function createWedding(RegisterRequestDto $dto): Wedding
    {
        $wedding = (new Wedding())
            ->setDate($dto->weddingDate)
            ->setLocation($dto->location)
            ->setBudgetCents($dto->budgetCents)
            ->setGuestCount($dto->guestCount);

        // Nothing sensitive is stored without the consent of the screen-3 step,
        // whatever the payload carries (RGPD-CONSENT-001).
        if (!$dto->sensitiveDataConsent) {
            return $wedding;
        }

        foreach ($this->em->getRepository(Confession::class)->findBy(['slug' => $dto->confessionSlugs]) as $confession) {
            $wedding->addConfession($confession);
        }

        foreach ($this->em->getRepository(Culture::class)->findBy(['slug' => $dto->cultureSlugs]) as $culture) {
            $wedding->addCulture($culture);
        }

        return $wedding;
    }

    /**
     * A lead is only worth creating towards a vendor that can actually answer it,
     * and the id comes from browser-held state (PROVIDER-LEAD-003).
     */
    private function activeVendor(string $vendorId): Vendor
    {
        $vendor = $this->vendorRepository->find($vendorId);

        if ($vendor === null || $vendor->getStatus() !== VendorStatus::Active) {
            throw new \DomainException('Ce prestataire n’est plus disponible.', 422);
        }

        return $vendor;
    }
}
