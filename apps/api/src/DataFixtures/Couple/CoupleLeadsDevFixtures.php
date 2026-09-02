<?php

declare(strict_types=1);

namespace App\DataFixtures\Couple;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\PlanningStage;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Couple\CoupleRepository;
use App\Repository\ProviderLead\ProviderLeadRepository;
use App\Repository\Region\RegionRepository;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use App\Repository\Wedding\WeddingStyleRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Peuple la zone « Demandes de contact » du couple (US-6.5) avec un lead dans
 * chacun des trois statuts que le couple voit.
 *
 * Sans elle l'écran n'est pas vérifiable en navigateur : aucune autre fixture ne
 * crée de `ProviderLead` ni même de `Couple`, et `REFUSEE` / `DEBLOQUEE` ne sont
 * pas atteignables via l'API tant qu'Epic 3 (WED-113) n'expose pas accepter /
 * refuser un lead. Le même jeu de données servira aux futurs E2E.
 *
 * Idempotente : conçue pour tourner avec `--append` sans créer de doublon. Elle
 * résout ses dépendances par repository plutôt que par référence, pour rester
 * indépendante de l'ordre et du jeu de fixtures vendor effectivement chargé.
 */
class CoupleLeadsDevFixtures extends Fixture implements FixtureGroupInterface
{
    public const COUPLE_EMAIL = 'couple@wedly.test';
    public const COUPLE_PASSWORD = 'couple1234';

    /**
     * L'ordre porte le sens : le premier vendor est celui dont la fiche est
     * dévoilée, c'est donc le seul qu'on enrichit.
     */
    private const LEADS = [
        ProviderLeadStatus::Accepted,  // -> DEBLOQUEE
        ProviderLeadStatus::Pending,   // -> EN_ATTENTE
        ProviderLeadStatus::Refused,   // -> REFUSEE
    ];

    private const BUDGET_CENTS = 2_350_000;

    private const FALLBACK_PHOTO_URL =
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80';

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly UserRepository $userRepository,
        private readonly CoupleRepository $coupleRepository,
        private readonly VendorRepository $vendorRepository,
        private readonly ProviderLeadRepository $providerLeadRepository,
        private readonly RegionRepository $regionRepository,
        private readonly WeddingStyleRepository $weddingStyleRepository,
    ) {}

    public static function getGroups(): array
    {
        return ['dev', 'couple-leads'];
    }

    public function load(ObjectManager $manager): void
    {
        // `UNIQ_provider_lead_couple_vendor` : un couple n'a qu'un lead par
        // prestataire, il faut donc autant de vendors distincts que de statuts.
        $vendors = $this->vendorRepository->findBy(
            ['status' => VendorStatus::Active],
            ['brandName' => 'ASC'],
            count(self::LEADS),
        );

        if (count($vendors) < count(self::LEADS)) {
            // Les fixtures vendor n'ont pas tourné : rien à rattacher.
            return;
        }

        $couple = $this->resolveCouple($manager);

        foreach (self::LEADS as $index => $status) {
            $vendor = $vendors[$index];

            $this->ensureZones($manager, $vendor);

            // Seul le lead débloqué dévoile la fiche : c'est le seul vendor dont
            // les champs de l'Écran 4 doivent être complets.
            if ($index === 0) {
                $this->enrichUnlockedVendor($vendor);
            }

            $this->ensureLead($manager, $couple, $vendor, $status);
        }

        $manager->flush();
    }

    private function resolveCouple(ObjectManager $manager): Couple
    {
        $user = $this->userRepository->findOneBy(['email' => self::COUPLE_EMAIL]);

        if ($user !== null) {
            $existing = $this->coupleRepository->findOneBy(['user' => $user]);

            if ($existing !== null) {
                return $existing;
            }
        }

        if ($user === null) {
            $user = (new User())
                ->setFirstName('Camille')
                ->setLastName('Perret')
                ->setEmail(self::COUPLE_EMAIL)
                ->setRoles([Role::Couple->value])
                ->setStatus(UserStatus::Active);
            $user->setPassword($this->passwordHasher->hashPassword($user, self::COUPLE_PASSWORD));

            $manager->persist($user);
        }

        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('+8 months'))
            ->setLocation('Lyon')
            ->setBudgetCents(self::BUDGET_CENTS)
            ->setGuestCount(110);

        $couple = (new Couple())
            ->setUser($user)
            ->setWedding($wedding)
            ->setPlanningStage(PlanningStage::InProgress);

        $manager->persist($wedding);
        $manager->persist($couple);

        return $couple;
    }

    /**
     * Les zones s'affichent aussi sur les cartes masquées : un vendor sans
     * région produirait une carte amputée d'un des trois critères d'acceptation.
     */
    private function ensureZones(ObjectManager $manager, Vendor $vendor): void
    {
        if (!$vendor->getRegions()->isEmpty()) {
            return;
        }

        $region = $this->regionRepository->findOneBy(['slug' => 'ile-de-france']);

        if ($region !== null) {
            $vendor->addRegion($region);
            $manager->persist($vendor);
        }
    }

    /**
     * `CoupleProviderLeadResponseDtoAssembler::vendorProfile()` lit des champs
     * qu'aucune fixture vendor ne renseigne aujourd'hui. Sans eux, l'Écran 4
     * s'affiche à moitié vide — « Sa présentation », « Son style » et la moitié
     * de « Ses coordonnées » disparaissent.
     */
    private function enrichUnlockedVendor(Vendor $vendor): void
    {
        if ($vendor->getBio() === null) {
            $vendor->setBio(
                "Nous croyons qu'un mariage se raconte dans les gestes discrets : "
                . "un regard échangé, une main qu'on serre, un fou rire au dessert.",
            );
        }

        if ($vendor->getDescription() === null) {
            $vendor->setDescription(
                "Une équipe de deux, présente du premier essayage au dernier morceau. "
                . "Nous travaillons en lumière naturelle, sans mise en scène, et vous "
                . "livrons une galerie complète sous trois semaines.",
            );
        }

        if ($vendor->getStyles()->isEmpty()) {
            foreach (['boheme', 'champetre'] as $slug) {
                $style = $this->weddingStyleRepository->findOneBy(['slug' => $slug]);

                if ($style !== null) {
                    $vendor->addStyle($style);
                }
            }
        }

        $vendor->setPhone($vendor->getPhone() ?? '06 12 34 56 78');
        $vendor->setAddress($vendor->getAddress() ?? '18 rue des Trois Ponts');
        $vendor->setZipcode($vendor->getZipcode() ?? '69004');
        $vendor->setCity($vendor->getCity() ?? 'Lyon');
    }

    private function ensureLead(
        ObjectManager $manager,
        Couple $couple,
        Vendor $vendor,
        ProviderLeadStatus $status,
    ): void {
        $existing = $this->providerLeadRepository->findOneBy([
            'couple' => $couple,
            'vendor' => $vendor,
        ]);

        if ($existing !== null) {
            // Idempotent, mais on réaligne le statut : c'est lui qu'on vient
            // démontrer, et Epic 3 n'est pas là pour le repositionner.
            $existing->setStatus($status);

            return;
        }

        $manager->persist(
            (new ProviderLead($couple, $vendor, self::BUDGET_CENTS, $this->coverPhoto($manager, $vendor)))
                ->setStatus($status),
        );
    }

    /**
     * La photo coup de cœur porte deux choses : l'image de la carte, et la
     * catégorie — `ProviderLeadCategoryResolver` la résout d'abord depuis les
     * tags primaires de cette image. Le constructeur de `ProviderLead` exige
     * qu'elle appartienne au vendor passé.
     */
    private function coverPhoto(ObjectManager $manager, Vendor $vendor): PortfolioImage
    {
        $existing = $vendor->getPortfolioImages()->first();

        if ($existing !== false) {
            return $existing;
        }

        // La photo coup de cœur fait partie des critères d'acceptation de la
        // carte masquée : un vendor au portfolio vide priverait la fixture de ce
        // qu'elle est censée démontrer.
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl(self::FALLBACK_PHOTO_URL)
            ->setSortOrder(0);

        $manager->persist($photo);

        return $photo;
    }
}
