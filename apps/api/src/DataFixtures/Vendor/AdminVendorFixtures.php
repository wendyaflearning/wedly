<?php

declare(strict_types=1);

namespace App\DataFixtures\Vendor;

use App\DataFixtures\Region\RegionFixtures;
use App\DataFixtures\Vendor\ServiceFixtures;
use App\DataFixtures\Wedding\WeddingStyleFixtures;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VenueType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use RuntimeException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AdminVendorFixtures extends Fixture implements FixtureGroupInterface, DependentFixtureInterface
{
    private const PASSWORD = 'vendor1234';

    private const DEMO_EMAILS = [
        'vendor-review-photo@wedly.test',
        'vendor-review-venue@wedly.test',
        'vendor-review-incomplete@wedly.test',
        'vendor-active-catering@wedly.test',
        'vendor-rejected-dj@wedly.test',
    ];

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    public static function getGroups(): array
    {
        return ['admin-vendors'];
    }

    public function getDependencies(): array
    {
        return [
            ServiceFixtures::class,
            RegionFixtures::class,
            WeddingStyleFixtures::class,
        ];
    }

    public function load(ObjectManager $manager): void
    {
        $this->removeExistingDemoVendors($manager);

        /** @var array<string, Service> $services */
        $services = $this->findRequiredBySlug($manager, Service::class, [
            'photographe',
            'lieu-de-reception',
            'traiteur',
            'dj',
        ]);

        /** @var array<string, Region> $regions */
        $regions = $this->findRequiredBySlug($manager, Region::class, [
            'ile-de-france',
            'provence-alpes-cote-d-azur',
            'normandie',
        ]);

        /** @var array<string, Culture> $cultures */
        $cultures = $this->findRequiredBySlug($manager, Culture::class, [
            'france',
            'maroc',
        ]);

        /** @var array<string, Confession> $confessions */
        $confessions = $this->findRequiredBySlug($manager, Confession::class, [
            'laic',
            'catholique',
        ]);

        $now = new \DateTimeImmutable();

        $this->createVendor(
            $manager,
            email: 'vendor-review-photo@wedly.test',
            firstName: 'Camille',
            lastName: 'Martin',
            brandName: 'Camille Martin Studio',
            description: 'Photographe de mariage documentaire, avec une approche éditoriale et naturelle.',
            bio: '8 ans d’expérience sur des mariages civils, religieux et multiculturels en France.',
            status: VendorStatus::UnderReview,
            userStatus: UserStatus::UnderReview,
            priceType: PriceType::PerService,
            priceMinCents: 180000,
            priceMaxCents: 420000,
            submittedAt: $now->modify('-2 days'),
            services: [$services['photographe']],
            regions: [$regions['ile-de-france'], $regions['provence-alpes-cote-d-azur']],
            cultures: [$cultures['france'], $cultures['maroc']],
            confessions: [$confessions['laic'], $confessions['catholique']],
            portfolioUrls: [
                'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&w=1200&q=80',
            ],
        );

        $venueVendor = $this->createVendor(
            $manager,
            email: 'vendor-review-venue@wedly.test',
            firstName: 'Nora',
            lastName: 'Belmont',
            brandName: 'Domaine de la Clairiere',
            description: 'Lieu de réception avec salle principale, jardin et hébergements sur place.',
            bio: 'Le domaine accueille des mariages intimistes et des célébrations jusqu’à 180 invités.',
            status: VendorStatus::UnderReview,
            userStatus: UserStatus::UnderReview,
            priceType: PriceType::PerService,
            priceMinCents: 650000,
            priceMaxCents: 1450000,
            submittedAt: $now->modify('-1 day'),
            services: [$services['lieu-de-reception']],
            regions: [$regions['normandie']],
            cultures: [$cultures['france']],
            confessions: [$confessions['laic']],
            portfolioUrls: [
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
            ],
        );
        $this->attachVenueDetails($venueVendor);

        $this->createVendor(
            $manager,
            email: 'vendor-review-incomplete@wedly.test',
            firstName: 'Lina',
            lastName: 'Moreau',
            brandName: 'Lina Moreau DJ',
            description: null,
            bio: null,
            status: VendorStatus::UnderReview,
            userStatus: UserStatus::UnderReview,
            priceType: PriceType::PerService,
            priceMinCents: 90000,
            priceMaxCents: 180000,
            submittedAt: $now->modify('-5 hours'),
            services: [$services['dj']],
            regions: [],
            cultures: [],
            confessions: [],
            portfolioUrls: [],
        );

        $cateringVendor = $this->createVendor(
            $manager,
            email: 'vendor-active-catering@wedly.test',
            firstName: 'Yanis',
            lastName: 'Benali',
            brandName: 'Maison Safran',
            description: 'Traiteur événementiel spécialisé dans les menus méditerranéens et les buffets premium.',
            bio: 'Cuisine de saison, options halal, végétariennes et service à table disponible.',
            status: VendorStatus::Active,
            userStatus: UserStatus::Active,
            priceType: PriceType::PerPerson,
            priceMinCents: 9500,
            priceMaxCents: 21000,
            submittedAt: $now->modify('-9 days'),
            reviewedAt: $now->modify('-6 days'),
            services: [$services['traiteur']],
            regions: [$regions['ile-de-france']],
            cultures: [$cultures['france'], $cultures['maroc']],
            confessions: [$confessions['laic']],
            portfolioUrls: [
                'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
            ],
        );
        $this->attachCateringDetails($cateringVendor);

        $this->createVendor(
            $manager,
            email: 'vendor-rejected-dj@wedly.test',
            firstName: 'Thomas',
            lastName: 'Roux',
            brandName: 'Pulse Event DJ',
            description: 'Animation musicale généraliste pour mariages et soirées privées.',
            bio: 'Prestations DJ avec sonorisation et éclairage.',
            status: VendorStatus::Rejected,
            userStatus: UserStatus::Suspended,
            priceType: PriceType::PerService,
            priceMinCents: 120000,
            priceMaxCents: 260000,
            submittedAt: $now->modify('-12 days'),
            reviewedAt: $now->modify('-10 days'),
            services: [$services['dj']],
            regions: [$regions['ile-de-france']],
            cultures: [$cultures['france']],
            confessions: [$confessions['laic']],
            portfolioUrls: [
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            ],
            rejectionReasons: [
                VendorRejectionReason::PortfolioQuality->value,
                VendorRejectionReason::DescriptionInsufficient->value,
            ],
            rejectionNote: 'Portfolio trop limité pour permettre une validation fiable du profil.',
        );

        $manager->flush();
    }

    /**
     * @param Service[] $services
     * @param Region[] $regions
     * @param Culture[] $cultures
     * @param Confession[] $confessions
     * @param string[] $portfolioUrls
     * @param string[]|null $rejectionReasons
     */
    private function createVendor(
        ObjectManager $manager,
        string $email,
        string $firstName,
        string $lastName,
        string $brandName,
        ?string $description,
        ?string $bio,
        VendorStatus $status,
        UserStatus $userStatus,
        PriceType $priceType,
        int $priceMinCents,
        int $priceMaxCents,
        \DateTimeImmutable $submittedAt,
        array $services,
        array $regions,
        array $cultures,
        array $confessions,
        array $portfolioUrls,
        ?\DateTimeImmutable $reviewedAt = null,
        ?array $rejectionReasons = null,
        ?string $rejectionNote = null,
    ): Vendor {
        $user = (new User())
            ->setEmail($email)
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->setRoles([Role::Vendor->value])
            ->setStatus($userStatus);
        $user->setPassword($this->passwordHasher->hashPassword($user, self::PASSWORD));

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName($brandName)
            ->setDescription($description)
            ->setBio($bio)
            ->setSiret($this->generateSiret($email))
            ->setAddress('12 rue des Demoiselles')
            ->setZipcode('75009')
            ->setCity('Paris')
            ->setPhone('+33600000000')
            ->setLegalName($brandName)
            ->setLegalForm('SASU')
            ->setIncorporatedAt(new \DateTimeImmutable('2021-04-12'))
            ->setLegalStatus('active')
            ->setSiretVerified(true)
            ->setPriceType($priceType)
            ->setPriceMinCents($priceMinCents)
            ->setPriceMaxCents($priceMaxCents)
            ->setStatus($status)
            ->setIsPublished($status === VendorStatus::Active)
            ->setSubmittedForReviewAt($submittedAt)
            ->setReviewedAt($reviewedAt)
            ->setRejectionReasons($rejectionReasons)
            ->setRejectionNote($rejectionNote);

        foreach ($services as $service) {
            $vendor->addService($service);
        }

        foreach ($regions as $region) {
            $vendor->addRegion($region);
        }

        foreach ($cultures as $culture) {
            $vendor->addCulture($culture);
        }

        foreach ($confessions as $confession) {
            $vendor->addConfession($confession);
        }

        foreach ($portfolioUrls as $sortOrder => $url) {
            $image = (new PortfolioImage())
                ->setVendor($vendor)
                ->setUrl($url)
                ->setSortOrder($sortOrder)
                ->setCloudinaryPublicId(null)
                ->setIsCover($sortOrder === 0);

            $manager->persist($image);
        }

        $manager->persist($user);
        $manager->persist($vendor);

        return $vendor;
    }

    private function attachVenueDetails(Vendor $vendor): void
    {
        $details = (new VendorVenueDetails())
            ->setVendor($vendor)
            ->setVenueType(VenueType::Domaine)
            ->setCapacityMin(60)
            ->setCapacityMax(180)
            ->setNearestCity('Deauville')
            ->setDistanceToCityMinutes(18)
            ->setHasCatering(false)
            ->setHasAccommodation(true)
            ->setHasOutdoorSpace(true)
            ->setHasCorkageFee(false)
            ->setIsPmrAccessible(true)
            ->setHasToilets(true);

        $vendor->setVenueDetails($details);
    }

    private function attachCateringDetails(Vendor $vendor): void
    {
        $details = (new VendorCateringDetails())
            ->setVendor($vendor)
            ->setCoversMin(40)
            ->setCoversMax(280)
            ->setIsHalal(true)
            ->setIsKosher(false)
            ->setIsVegan(true)
            ->setIsGlutenFree(true)
            ->setOffersTableService(true)
            ->setOffersBuffet(true)
            ->setOffersCocktail(true)
            ->setProvidesTableware(true)
            ->setProvidesFurniture(false);

        $vendor->setCateringDetails($details);
    }

    private function removeExistingDemoVendors(ObjectManager $manager): void
    {
        $users = $manager->getRepository(User::class)->findBy(['email' => self::DEMO_EMAILS]);

        foreach ($users as $user) {
            $vendor = $manager->getRepository(Vendor::class)->findOneBy(['user' => $user]);

            if ($vendor instanceof Vendor) {
                $manager->remove($vendor);
            }

            $manager->remove($user);
        }

        $manager->flush();
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $className
     * @param string[] $slugs
     *
     * @return array<string, T>
     */
    private function findRequiredBySlug(ObjectManager $manager, string $className, array $slugs): array
    {
        $entities = $manager->getRepository($className)->findBy(['slug' => $slugs]);
        $indexed = [];

        foreach ($entities as $entity) {
            $indexed[$entity->getSlug()] = $entity;
        }

        $missingSlugs = array_values(array_diff($slugs, array_keys($indexed)));

        if ($missingSlugs !== []) {
            throw new RuntimeException(sprintf(
                'Missing reference data for %s: %s. Load the base region/wedding fixtures before running the admin-vendors fixture.',
                $className,
                implode(', ', $missingSlugs),
            ));
        }

        return $indexed;
    }

    private function generateSiret(string $email): string
    {
        return substr(str_pad((string) abs(crc32($email)), 14, '0', STR_PAD_LEFT), 0, 14);
    }
}
