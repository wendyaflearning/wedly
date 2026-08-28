<?php

declare(strict_types=1);

namespace App\Service\Couple;

use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use App\Enum\Couple\ConsentType;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Seul point d'écriture du parcours de création de compte couple : les écrans 1
 * à 6 ne persistent rien (COUPLE-ONBOARDING-001), tout tombe ici dans une
 * transaction unique.
 *
 * Le service porte sa propre transaction et pas seulement son flush : c'est la
 * révision qu'ADR-006 avait explicitement prévue pour « création couple +
 * wedding en un seul commit ». Le contrôleur ne fait ni l'un ni l'autre.
 */
final readonly class CoupleRegistrationService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function register(RegisterCoupleRequestDto $dto): User
    {
        if ($this->userRepository->isEmailTaken($dto->email)) {
            throw new \DomainException('Cet email est déjà utilisé.', 409);
        }

        // Un refus vide les listes avant toute écriture. Le frontend est censé
        // les envoyer vides, le backend ne s'y fie pas : c'est la seule garantie
        // qu'aucune donnée sensible n'atterrit en base sans consentement
        // (RGPD-CONSENT-006).
        $granted     = $dto->sensitiveDataConsent;
        $confessions = $granted ? $this->resolveConfessions($dto->confessionSlugs) : [];
        $cultures    = $granted ? $this->resolveCultures($dto->cultureSlugs) : [];

        $vendor = $dto->contactRequest !== null
            ? $this->resolveActiveVendor($dto->contactRequest->vendorId)
            : null;

        $crushPhoto = $vendor !== null && $dto->contactRequest?->portfolioImageId !== null
            ? $this->resolveCrushPhoto($vendor, $dto->contactRequest->portfolioImageId)
            : null;

        $user = (new User())
            ->setFirstName(trim($dto->firstName))
            ->setEmail($dto->email)
            ->setRoles([Role::Couple->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));

        // zone / ambiance / ceremonyType restent null : aucun écran du parcours
        // ne les renseigne, et une valeur par défaut serait relue par Wedmatch
        // comme une vraie préférence (COUPLE-ONBOARDING-003).
        $wedding = (new Wedding())
            ->setDate($dto->weddingDate)
            ->setLocation(trim($dto->location))
            ->setBudgetCents($dto->budgetCents)
            ->setGuestCount($dto->guestCount);

        foreach ($confessions as $confession) {
            $wedding->addConfession($confession);
        }

        foreach ($cultures as $culture) {
            $wedding->addCulture($culture);
        }

        $couple = (new Couple())
            ->setUser($user)
            ->setWedding($wedding)
            ->setPlanningStage($dto->planningStage);

        // Entrée append-only : le consentement est tracé qu'il soit accordé ou
        // refusé, un refus n'est pas une absence de décision.
        $consent = new WeddingConsent($wedding, ConsentType::SensitiveData, $granted);

        // Un simple épingle n'envoie pas de contactRequest et ne produit donc
        // aucun lead (PROVIDER-LEAD-001). Le lead garde sa propre copie du
        // montant, figée à la création (PROVIDER-LEAD-002), et la photo coup de
        // cœur qui a déclenché la demande (PROVIDER-LEAD-004).
        $lead = $vendor !== null
            ? new ProviderLead($couple, $vendor, $dto->budgetCents, $crushPhoto)
            : null;

        $this->em->beginTransaction();

        try {
            $this->em->persist($user);
            $this->em->persist($wedding);
            $this->em->persist($couple);
            $this->em->persist($consent);

            if ($lead !== null) {
                $this->em->persist($lead);
            }

            $this->em->flush();
            $this->em->commit();
        } catch (UniqueConstraintViolationException) {
            // Le contrôle ci-dessus laisse passer deux requêtes concurrentes sur
            // le même email : elles peuvent le franchir toutes les deux avant
            // qu'aucune n'ait committé. La contrainte unique de `app_user.email`
            // est le seul filet qui reste, et c'est aussi la seule contrainte
            // d'unicité métier de cette transaction — la ramener au même 409 que
            // le chemin nominal évite un 500 que l'ExceptionListener ne saurait
            // pas mapper. Même patron que PatchVendorSettingsAction.
            $this->em->rollback();

            throw new \DomainException('Cet email est déjà utilisé.', 409);
        } catch (\Throwable $throwable) {
            $this->em->rollback();

            throw $throwable;
        }

        return $user;
    }

    /**
     * @param string[] $slugs
     *
     * @return Confession[]
     */
    private function resolveConfessions(array $slugs): array
    {
        return $this->resolveBySlug(Confession::class, $slugs, 'Confession inconnue');
    }

    /**
     * @param string[] $slugs
     *
     * @return Culture[]
     */
    private function resolveCultures(array $slugs): array
    {
        return $this->resolveBySlug(Culture::class, $slugs, 'Origine culturelle inconnue');
    }

    /**
     * Les repositories Confession et Culture sont `final` : ils sont résolus via
     * l'EntityManager, comme le fait déjà la commande de seed de WED-107.
     *
     * @template T of object
     *
     * @param class-string<T> $className
     * @param string[]        $slugs
     *
     * @return T[]
     */
    private function resolveBySlug(string $className, array $slugs, string $label): array
    {
        $repository = $this->em->getRepository($className);
        $resolved   = [];

        foreach (array_unique($slugs) as $slug) {
            $entity = $repository->findOneBy(['slug' => $slug]);

            if ($entity === null) {
                throw new \DomainException(sprintf('%s : « %s ».', $label, $slug), 422);
            }

            $resolved[] = $entity;
        }

        return $resolved;
    }

    /**
     * Le vendorId vient de l'état client : il est revalidé ici, existence et
     * statut compris, pour répondre 422 plutôt que 500 (PROVIDER-LEAD-003).
     */
    private function resolveActiveVendor(string $vendorId): Vendor
    {
        $vendor = $this->em->getRepository(Vendor::class)->findOneBy(['id' => $vendorId]);

        if (!$vendor instanceof Vendor || $vendor->getStatus() !== VendorStatus::Active) {
            throw new \DomainException('Ce prestataire n\'est pas disponible.', 422);
        }

        return $vendor;
    }

    /**
     * La photo coup de cœur vient elle aussi de l'état client. Elle doit
     * appartenir au prestataire ciblé — sinon la carte du couple afficherait le
     * travail d'un tiers — et être publiée dans Wedream, seule galerie où le
     * couple a pu la voir. Un identifiant qui ne satisfait pas ces deux
     * conditions est refusé en 422, jamais silencieusement ignoré : c'est un
     * état client incohérent, pas une absence de photo.
     */
    private function resolveCrushPhoto(Vendor $vendor, string $portfolioImageId): PortfolioImage
    {
        $image = $this->em->getRepository(PortfolioImage::class)->findOneBy(['id' => $portfolioImageId]);

        if (!$image instanceof PortfolioImage
            || $image->getVendor() !== $vendor
            || !$image->isVisibleInWedream()
        ) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }
}
