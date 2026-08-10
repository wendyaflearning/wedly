<?php

declare(strict_types=1);

namespace App\Command\Vendor;

use App\Dispatcher\Vendor\Onboarding\VendorOnboardingStepDispatcher;
use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\User\Role;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Exception\ValidationException;
use App\Repository\Confession\ConfessionRepository;
use App\Repository\Culture\CultureRepository;
use App\Repository\Region\RegionRepository;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\ServiceRepository;
use App\Resolver\Vendor\OnboardingStepResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:vendor:seed-test',
    description: 'Seed 5 test vendor accounts through the real onboarding handlers',
)]
class SeedTestVendorsCommand extends Command
{
    private const TEST_PASSWORD = 'SeedTest@2026!';

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly VendorOnboardingStepDispatcher $dispatcher,
        private readonly CultureRepository $cultureRepository,
        private readonly ConfessionRepository $confessionRepository,
        private readonly OnboardingStepResolver $stepResolver,
        private readonly ServiceRepository $serviceRepository,
        private readonly RegionRepository $regionRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Simulate without persisting');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io     = new SymfonyStyle($input, $output);
        $dryRun = $input->getOption('dry-run');

        $culture    = $this->cultureRepository->findOneBy([]);
        $confession = $this->confessionRepository->findOneBy([]);

        if ($culture === null || $confession === null) {
            $io->error('No cultures or confessions found in DB. Load fixtures first: bin/console doctrine:fixtures:load --group=reference');

            return Command::FAILURE;
        }

        $experiencesData = [
            'culture_ids'    => [$culture->getId()->toRfc4122()],
            'confession_ids' => [$confession->getId()->toRfc4122()],
        ];

        $profiles = $this->buildProfiles($experiencesData);
        $rows     = [];

        foreach ($profiles as $profile) {
            [$status, $note] = $this->processProfile($profile, $dryRun, $io);
            $rows[]          = [$profile['email'], $profile['brand_name'], $status, $note];
        }

        $io->table(['Email', 'Brand', 'Statut', 'Note'], $rows);

        if (!$dryRun) {
            $io->note(sprintf('Mot de passe test : %s', self::TEST_PASSWORD));
        }

        return Command::SUCCESS;
    }

    /** @return array{string, string} */
    private function processProfile(array $profile, bool $dryRun, SymfonyStyle $io): array
    {
        if ($this->userRepository->findOneBy(['email' => $profile['email']]) !== null) {
            return ['skipped', 'already exists'];
        }

        if ($dryRun) {
            return ['dry-run', 'would be created'];
        }

        $this->em->beginTransaction();
        try {
            $user = new User();
            $user->setEmail($profile['email'])
                 ->setFirstName($profile['first_name'])
                 ->setRoles([Role::Vendor->value])
                 ->setPassword($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32))));

            $vendor = new Vendor();
            $vendor->setUser($user)
                   ->setBrandName($profile['brand_name'])
                   ->setPriceType(PriceType::PerService)
                   ->setPriceMinCents(0)
                   ->setPriceMaxCents(0);

            $this->em->persist($user);
            $this->em->persist($vendor);
            $this->em->flush();

            $this->dispatcher->handle($vendor, $this->dto('professions', [
                'service_ids' => [$this->resolveServiceId($profile['service_slug'])],
            ]));

            $steps = $this->stepResolver->getOnboardingSteps($vendor->resolveVendorType());

            foreach ($steps as $step) {
                if (in_array($step, [OnboardingStep::Professions, OnboardingStep::Credentials], true)) {
                    continue;
                }

                if ($step === OnboardingStep::Portfolio) {
                    $this->seedPortfolio($vendor);
                    continue;
                }

                $stepData = $profile['steps'][$step->value] ?? [];
                if ($step === OnboardingStep::ZonesPricing && isset($stepData['zones'])) {
                    $stepData['zones'] = $this->resolveRegionIds($stepData['zones']);
                }

                $this->dispatcher->handle($vendor, $this->dto($step->value, $stepData));
            }

            // Credentials last — triggers VendorOnboardingSubmittedEvent (confirmation email)
            $this->dispatcher->handle($vendor, $this->dto('credentials', [
                'password'              => self::TEST_PASSWORD,
                'password_confirmation' => self::TEST_PASSWORD,
            ]));

            $this->em->commit();

            return ['créé', ''];
        } catch (\Throwable $e) {
            $this->em->rollback();
            $this->em->clear();

            $detail = $e->getMessage();
            if ($e instanceof ValidationException) {
                $detail = implode('; ', array_map(
                    static fn (array $v): string => sprintf('%s: %s', $v['field'], $v['message']),
                    $e->getViolations(),
                ));
            }

            $io->warning(sprintf('[%s] %s', $profile['email'], $detail));

            return ['erreur', substr($detail, 0, 80)];
        }
    }

    private function seedPortfolio(Vendor $vendor): void
    {
        $images = [
            (new PortfolioImage())->setVendor($vendor)
                ->setUrl('https://res.cloudinary.com/dadvrspox/image/upload/v1782930021/wedly/vendors/019f1e5f-3bdb-78e6-a836-7cdec46ddd11/hzpuysrrdwpcji0ta57q.jpg')
                ->setSortOrder(0)->setIsCover(true),
            (new PortfolioImage())->setVendor($vendor)
                ->setUrl('https://res.cloudinary.com/dadvrspox/image/upload/v1782757601/wedly/vendors/019de90e-81de-715c-8c1a-6564d8934361/forbkjic4591zs8on6n9.jpg')
                ->setSortOrder(1)->setIsCover(false),
            (new PortfolioImage())->setVendor($vendor)
                ->setUrl('https://res.cloudinary.com/dadvrspox/image/upload/v1782930025/wedly/vendors/019f1e5f-3bdb-78e6-a836-7cdec46ddd11/jtqdszqzmkkaqm8ejnfs.jpg')
                ->setSortOrder(2)->setIsCover(false),
        ];

        foreach ($images as $image) {
            $this->em->persist($image);
        }
        $this->em->flush();

        $vendor->setOnboardingStep(OnboardingStep::Portfolio);
        $this->em->flush();
    }

    private function dto(string $step, array $data): VendorOnboardingStepRequestDto
    {
        return new VendorOnboardingStepRequestDto($step, $data);
    }

    private function resolveServiceId(string $slug): string
    {
        $service = $this->serviceRepository->findOneBy(['slug' => $slug]);
        if ($service === null) {
            throw new \RuntimeException(sprintf('Service introuvable pour le slug "%s"', $slug));
        }

        return $service->getId()->toRfc4122();
    }

    /**
     * @param string[] $slugs
     * @return string[]
     */
    private function resolveRegionIds(array $slugs): array
    {
        return array_map(function (string $slug): string {
            $region = $this->regionRepository->findOneBy(['slug' => $slug]);
            if ($region === null) {
                throw new \RuntimeException(sprintf('Région introuvable pour le slug "%s"', $slug));
            }

            return $region->getId()->toRfc4122();
        }, $slugs);
    }

    /** @return array<int, array{email: string, first_name: string, brand_name: string, service_slug: string, steps: array<string, array>}> */
    private function buildProfiles(array $experiencesData): array
    {
        return [
            [
                'email'      => 'contact+vendor-lieu-camille@wedly-apps.com',
                'first_name' => 'Camille',
                'brand_name' => 'Domaine Test',
                'service_slug' => 'lieu-de-reception',
                'steps'      => [
                    'venue_characteristics' => [
                        'venue_type'               => 'domaine',
                        'capacity_min'             => 50,
                        'capacity_max'             => 300,
                        'has_catering'             => false,
                        'has_accommodation'        => true,
                        'has_outdoor_space'        => true,
                        'has_corkage_fee'          => false,
                        'has_toilets'              => true,
                        'is_pmr_accessible'        => false,
                        'nearest_city'             => 'Lyon',
                        'distance_to_city_minutes' => 20,
                    ],
                    'zones_pricing' => [
                        'price_min'               => 300000,
                        'price_max'               => 800000,
                        'price_type'              => 'per_service',
                        'zones'                   => ['auvergne-rhone-alpes'],
                        'city'                    => 'Lyon',
                        'nearest_city'            => 'Lyon',
                        'distance_to_city_minutes' => 20,
                    ],
                    'legal_info' => [
                        'brand_name' => 'Domaine Test',
                        'first_name' => 'Camille',
                        'last_name'  => 'Beaumont',
                        'siret'      => '12345678901234',
                        'phone'      => '0612345678',
                        'address'    => '1 Rue de Test',
                        'zipcode'    => '69000',
                        'city'       => 'Lyon',
                    ],
                ],
            ],
            [
                'email'      => 'contact+vendor-photographe-lucas@wedly-apps.com',
                'first_name' => 'Lucas',
                'brand_name' => 'Lucas Photographie',
                'service_slug' => 'photographe',
                'steps'      => [
                    'consent'       => ['granted' => true],
                    'experiences'   => $experiencesData,
                    'zones_pricing' => [
                        'price_min'  => 80000,
                        'price_max'  => 250000,
                        'price_type' => 'per_service',
                        'zones'      => ['ile-de-france'],
                    ],
                    'legal_info' => [
                        'brand_name' => 'Lucas Photographie',
                        'first_name' => 'Lucas',
                        'last_name'  => 'Bernard',
                        'siret'      => '23456789012345',
                        'phone'      => '0612345678',
                        'address'    => '1 Rue de Test',
                        'zipcode'    => '75001',
                        'city'       => 'Paris',
                    ],
                ],
            ],
            [
                'email'      => 'contact+vendor-traiteur-sophie@wedly-apps.com',
                'first_name' => 'Sophie',
                'brand_name' => 'Saveurs & Co Test',
                'service_slug' => 'traiteur',
                'steps'      => [
                    'consent'     => ['granted' => true],
                    'experiences' => $experiencesData,
                    'catering_characteristics' => [
                        'covers_min'              => 20,
                        'covers_max'              => 300,
                        'is_kosher'               => false,
                        'is_halal'                => false,
                        'is_vegan'                => true,
                        'is_gluten_free'          => true,
                        'is_offers_table_service' => true,
                        'is_offers_buffet'        => true,
                        'is_offers_cocktail'      => false,
                        'is_provide_tableware'    => true,
                        'is_provide_furniture'    => false,
                    ],
                    'zones_pricing' => [
                        'price_min'  => 5000,
                        'price_max'  => 15000,
                        'price_type' => 'per_service',
                        'zones'      => [
                            'ile-de-france',
                            'hauts-de-france',
                        ],
                    ],
                    'legal_info' => [
                        'brand_name' => 'Saveurs & Co Test',
                        'first_name' => 'Sophie',
                        'last_name'  => 'Martin',
                        'siret'      => '34567890123456',
                        'phone'      => '0612345678',
                        'address'    => '1 Rue de Test',
                        'zipcode'    => '75001',
                        'city'       => 'Paris',
                    ],
                ],
            ],
            [
                'email'      => 'contact+vendor-createur-angelique@wedly-apps.com',
                'first_name' => 'Angélique',
                'brand_name' => 'Atelier de lutel',
                'service_slug' => 'creatrice-robe-de-mariee',
                'steps'      => [
                    'consent'       => ['granted' => true],
                    'experiences'   => $experiencesData,
                    'zones_pricing' => [
                        'price_min'  => 20000,
                        'price_max'  => 60000,
                        'price_type' => 'per_service',
                        'zones'      => ['ile-de-france'],
                        'city'       => 'Paris',
                    ],
                    'legal_info' => [
                        'brand_name' => 'Atelier de lutel',
                        'first_name' => 'Angélique',
                        'last_name'  => 'Dubois',
                        'siret'      => '45678901234567',
                        'phone'      => '0612345678',
                        'address'    => '1 Rue de Test',
                        'zipcode'    => '75001',
                        'city'       => 'Paris',
                    ],
                ],
            ],
            [
                'email'      => 'contact+vendor-animateur-marie@wedly-apps.com',
                'first_name' => 'Marie',
                'brand_name' => 'Marie Live Sketch',
                'service_slug' => 'live-sketching',
                'steps'      => [
                    'consent'       => ['granted' => true],
                    'experiences'   => $experiencesData,
                    'zones_pricing' => [
                        'price_min'  => 30000,
                        'price_max'  => 90000,
                        'price_type' => 'per_service',
                        'zones'      => ['ile-de-france'],
                    ],
                    'legal_info' => [
                        'brand_name' => 'Marie Live Sketch',
                        'first_name' => 'Marie',
                        'last_name'  => 'Leclerc',
                        'siret'      => '56789012345678',
                        'phone'      => '0612345678',
                        'address'    => '1 Rue de Test',
                        'zipcode'    => '75001',
                        'city'       => 'Paris',
                    ],
                ],
            ],
        ];
    }
}
