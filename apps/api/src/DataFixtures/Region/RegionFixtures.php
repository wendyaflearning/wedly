<?php

declare(strict_types=1);

namespace App\DataFixtures\Region;

use App\Entity\Region\Region;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class RegionFixtures extends Fixture
{
    /** @var array<string, string> slug => name */
    private const REGIONS = [
        'auvergne-rhone-alpes'      => 'Auvergne-Rhône-Alpes',
        'bourgogne-franche-comte'   => 'Bourgogne-Franche-Comté',
        'bretagne'                  => 'Bretagne',
        'centre-val-de-loire'       => 'Centre-Val de Loire',
        'corse'                     => 'Corse',
        'grand-est'                 => 'Grand Est',
        'hauts-de-france'           => 'Hauts-de-France',
        'ile-de-france'             => 'Île-de-France',
        'normandie'                 => 'Normandie',
        'nouvelle-aquitaine'        => 'Nouvelle-Aquitaine',
        'occitanie'                 => 'Occitanie',
        'pays-de-la-loire'          => 'Pays de la Loire',
        'provence-alpes-cote-dazur' => "Provence-Alpes-Côte d'Azur",
        'guadeloupe'                => 'Guadeloupe',
        'martinique'                => 'Martinique',
        'guyane'                    => 'Guyane',
        'la-reunion'                => 'La Réunion',
        'mayotte'                   => 'Mayotte',
    ];

    public function load(ObjectManager $manager): void
    {
        foreach (self::REGIONS as $slug => $name) {
            $region = new Region();
            $region->setName($name)->setSlug($slug);

            $manager->persist($region);
            $this->addReference('region-' . $slug, $region);
        }

        $manager->flush();
    }
}
