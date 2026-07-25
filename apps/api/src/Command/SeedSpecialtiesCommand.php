<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Vendor\Specialty;
use App\Repository\Vendor\ServiceRepository;
use App\Repository\Vendor\SpecialtyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\String\Slugger\SluggerInterface;

#[AsCommand(
    name: 'app:seed-specialties',
    description: 'Idempotent upsert of the specialty catalogue (49 tags across 10 services)',
)]
class SeedSpecialtiesCommand extends Command
{
    /** @var array<string, list<string>> service_slug => ordered tag names */
    private const CATALOG = [
        'traiteur' => [
            'Gastronomique',
            'Buffet convivial',
            'Street food chic',
            'Cuisine du monde',
            'Végétal | Healthy',
            'Brunch | Cocktail dînatoire',
        ],
        'photographe' => [
            'Éditorial',
            'Fine art',
            'Lifestyle',
            'Bohème',
            'Classique | Intemporel',
            'Moody',
        ],
        'lieu-de-reception' => [
            'Château',
            'Domaine',
            'Loft industriel',
            'Salle de réception',
            'Hôtel',
        ],
        'maquillage' => [
            'Naturel | Nude',
            'Glamour | Soft glam',
            'Romantique',
            'Chic | Sophistiqué',
        ],
        'coiffure' => [
            'Chignon romantique | Flou',
            'Tressé',
            'Ondulé | Wavy',
            'Lisse | Structuré',
        ],
        'decoration' => [
            'Bohème',
            'Champêtre',
            'Minimaliste',
            'Chic | Élégant',
            'Végétal',
        ],
        'dj' => [
            'Pop',
            'Rock',
            'Variété française',
            'Années 80/90',
            'Hip-hop | R&B',
            'Afrobeats',
            'Électro | House',
            'Funk | Disco',
            'Latino',
            'Jazz | Soul | Lounge',
            'Musiques du monde',
            'Polyvalent | Tous styles',
        ],
        'creatrice-robe-de-mariee' => [
            'Sur-mesure | Haute couture',
            'Prêt-à-porter (retouché)',
        ],
        'coordinatrice-mariage' => [
            'Organisation complète',
            'Organisation partielle',
            'Coordination jour J',
        ],
        'tailleur-homme' => [
            'Sur-mesure',
            'Prêt-à-porter (retouché)',
        ],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ServiceRepository $serviceRepository,
        private readonly SpecialtyRepository $specialtyRepository,
        private readonly SluggerInterface $slugger,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Seeding specialties');

        $created = 0;
        $updated = 0;
        $deactivated = 0;

        foreach (self::CATALOG as $serviceSlug => $names) {
            $service = $this->serviceRepository->findOneBy(['slug' => $serviceSlug]);

            if ($service === null) {
                $io->error(sprintf('Service not found: slug="%s". Aborting.', $serviceSlug));

                return Command::FAILURE;
            }

            // Index existing specialties for this service by slug
            $existing = [];
            foreach ($this->specialtyRepository->findBy(['service' => $service]) as $specialty) {
                $existing[$specialty->getSlug()] = $specialty;
            }

            $catalogSlugs = [];
            foreach ($names as $sortOrder => $name) {
                $slug = $this->toSlug($name);

                if (isset($catalogSlugs[$slug])) {
                    $io->error(sprintf(
                        'Intra-service slug collision on service "%s": slug "%s" generated twice (from "%s" and "%s"). Aborting.',
                        $serviceSlug,
                        $slug,
                        $catalogSlugs[$slug],
                        $name,
                    ));

                    return Command::FAILURE;
                }

                $catalogSlugs[$slug] = $name;

                if (isset($existing[$slug])) {
                    $specialty = $existing[$slug];
                    $specialty->setName($name)->setSortOrder($sortOrder + 1)->setIsActive(true);
                    ++$updated;
                } else {
                    $specialty = (new Specialty())
                        ->setName($name)
                        ->setSlug($slug)
                        ->setSortOrder($sortOrder + 1)
                        ->setIsActive(true)
                        ->setService($service);

                    $this->em->persist($specialty);
                    ++$created;
                }
            }

            // Deactivate specialties in DB but absent from catalog
            foreach ($existing as $slug => $specialty) {
                if (!isset($catalogSlugs[$slug])) {
                    $specialty->setIsActive(false);
                    ++$deactivated;
                }
            }
        }

        $this->em->flush();

        $io->success(sprintf(
            'Done. Created: %d | Updated: %d | Deactivated: %d',
            $created,
            $updated,
            $deactivated,
        ));

        return Command::SUCCESS;
    }

    private function toSlug(string $name): string
    {
        return $this->slugger->slug($name)->lower()->toString();
    }
}
