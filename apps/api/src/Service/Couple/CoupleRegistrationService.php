<?php

declare(strict_types=1);

namespace App\Service\Couple;

use App\DTO\Couple\ProviderContactRequestDto;
use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
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

        // Tout est résolu avant d'ouvrir la transaction : un identifiant
        // incohérent sort en 422 sans qu'aucune écriture n'ait commencé, il n'y a
        // donc rien à annuler.
        $leads = $this->buildProviderLeads($dto, $couple);
        $pins  = $this->buildCouplePins($dto, $couple);

        $this->em->beginTransaction();

        try {
            $this->em->persist($user);
            $this->em->persist($wedding);
            $this->em->persist($couple);
            $this->em->persist($consent);

            foreach ($leads as $lead) {
                $this->em->persist($lead);
            }

            foreach ($pins as $pin) {
                $this->em->persist($pin);
            }

            $this->em->flush();
            $this->em->commit();
            // TODO PROVIDER-LEAD-007 : le catch UniqueConstraintViolationException ci-dessous suppose une seule contrainte unique possible (email). Un doublon dans $dto->pins violerait aussi UNIQ_couple_pin_couple_image et serait incorrectement mappé sur "email déjà utilisé". Pas bloquant (nécessite bug frontend ou race), à traiter si ça remonte en prod.
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
     * Un simple épingle n'envoie pas de demande de contact et ne produit donc
     * aucun lead (PROVIDER-LEAD-001). Chaque lead garde sa propre copie du
     * montant, figée à la création (PROVIDER-LEAD-002), et la photo coup de
     * cœur qui a déclenché la demande (PROVIDER-LEAD-004).
     *
     * Un couple n'a qu'un lead par prestataire (PROVIDER-LEAD-007) : le parcours
     * peut contacter deux fois le même prestataire depuis deux photos, c'est un
     * geste légitime côté couple, pas une erreur à lui renvoyer. La première
     * demande dans l'ordre du tableau gagne — avec sa photo — et les suivantes
     * vers ce même prestataire sont ignorées en silence.
     *
     * @return ProviderLead[]
     */
    private function buildProviderLeads(RegisterCoupleRequestDto $dto, Couple $couple): array
    {
        $leads         = [];
        $seenVendorIds = [];

        foreach ($this->contactRequestsOf($dto) as $contactRequest) {
            $vendor   = $this->resolveActiveVendor($contactRequest);
            $vendorId = (string) $vendor->getId();

            if (isset($seenVendorIds[$vendorId])) {
                continue;
            }

            $seenVendorIds[$vendorId] = true;

            $crushPhoto = $contactRequest->portfolioImageId !== null
                ? $this->resolveCrushPhoto($vendor, $contactRequest->portfolioImageId)
                : null;

            $leads[] = new ProviderLead($couple, $vendor, $dto->budgetCents, $crushPhoto);
        }

        return $leads;
    }

    /**
     * TODO WED-152 : contactRequest (singulier) est un shim de compatibilité, à
     * retirer une fois le frontend basculé sur contactRequests/pins. Ticket de
     * nettoyage à créer.
     *
     * Le renommage seul aurait fait disparaître les demandes de contact sans
     * bruit : la clé `contactRequest` du payload actuel serait simplement ignorée
     * à la dénormalisation, sans 422 pour le signaler. Le tableau prime dès
     * qu'il porte quelque chose, l'ancien champ ne sert que s'il est vide.
     *
     * @return ProviderContactRequestDto[]
     */
    private function contactRequestsOf(RegisterCoupleRequestDto $dto): array
    {
        if ($dto->contactRequests !== []) {
            return $dto->contactRequests;
        }

        return $dto->contactRequest !== null ? [$dto->contactRequest] : [];
    }

    /**
     * Les photos épinglées sont validées une à une comme n'importe quelle photo
     * du parcours : exister et être publiée dans Wedream, seule galerie où le
     * couple a pu les voir. Aucun dédoublonnage applicatif ici — la contrainte
     * unique de `couple_pin` reste le seul juge (voir le TODO PROVIDER-LEAD-007
     * sur le mapping du catch).
     *
     * @return CouplePin[]
     */
    private function buildCouplePins(RegisterCoupleRequestDto $dto, Couple $couple): array
    {
        $pins = [];

        foreach ($dto->pins as $portfolioImageId) {
            $pins[] = new CouplePin($couple, $this->findVisiblePortfolioImage($portfolioImageId));
        }

        return $pins;
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
     * La demande de contact désigne son prestataire par deux chemins. Le
     * `vendorId` est le chemin historique, revalidé ici — existence et statut —
     * pour répondre 422 plutôt que 500 (PROVIDER-LEAD-003). En son absence, le
     * prestataire est déduit côté serveur de la photo coup de cœur : c'est la
     * cible réelle du parcours, et le couple n'a jamais eu à connaître son
     * identifiant (WED-150).
     *
     * Le contrôle de statut s'applique aux deux chemins. `isVisibleInWedream`
     * est recalculé au tagging, pas à chaque changement de statut du
     * prestataire : une photo encore taguée visible ne dit rien de la
     * disponibilité actuelle de son propriétaire, et sans ce contrôle un vendor
     * désactivé resterait joignable par une vieille photo.
     */
    private function resolveActiveVendor(ProviderContactRequestDto $contactRequest): Vendor
    {
        if ($contactRequest->vendorId !== null) {
            $vendor = $this->em->getRepository(Vendor::class)->find($contactRequest->vendorId);
        } elseif ($contactRequest->portfolioImageId !== null) {
            $vendor = $this->findVisiblePortfolioImage($contactRequest->portfolioImageId)->getVendor();
        } else {
            // La contrainte de classe du DTO refuse déjà les deux absences, mais
            // le service reste le dernier rempart : il est aussi appelé sans
            // passer par MapRequestPayload.
            throw new \DomainException('Cette demande de contact ne cible aucun prestataire.', 422);
        }

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
        $image = $this->findVisiblePortfolioImage($portfolioImageId);

        if ($image->getVendor() !== $vendor) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }

    /**
     * Publiée dans Wedream ou rien : la condition est isolée ici parce que les
     * deux appelants s'appuient dessus — la résolution du prestataire depuis la
     * photo et la validation de la photo elle-même. `find()` plutôt que
     * `findOneBy(['id' => …])` pour que le second appel du parcours « photo
     * seule » retombe sur l'identity map au lieu de refaire la requête.
     */
    private function findVisiblePortfolioImage(string $portfolioImageId): PortfolioImage
    {
        $image = $this->em->getRepository(PortfolioImage::class)->find($portfolioImageId);

        if (!$image instanceof PortfolioImage || !$image->isVisibleInWedream()) {
            throw new \DomainException('Cette photo n\'est pas disponible.', 422);
        }

        return $image;
    }
}
