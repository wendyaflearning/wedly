<?php

declare(strict_types=1);

namespace App\DataFixtures\Vendor;

use App\Entity\Vendor\Service;
use App\Enum\Vendor\VendorType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

class ServiceFixtures extends Fixture implements FixtureGroupInterface
{
    public static function getGroups(): array
    {
        return ['service'];
    }

    public function load(ObjectManager $manager): void
    {
        $order = 100;

        // ANIMATIONS
        $animations = $this->create($manager, 'Animations', 'animations', $order++, VendorType::Freelance);

        $musicales = $this->create($manager, 'Musicales', 'animations-musicales', $order++, VendorType::Freelance, $animations);
        $this->create($manager, 'Groupe Live', 'groupe-live', $order++, VendorType::Freelance, $musicales);
        $this->create($manager, 'Orchestre', 'orchestre', $order++, VendorType::Freelance, $musicales);
        $this->create($manager, 'Harpe', 'harpe', $order++, VendorType::Freelance, $musicales);
        $this->create($manager, 'Jazz Band', 'jazz-band', $order++, VendorType::Freelance, $musicales);
        $this->create($manager, 'Chorale', 'chorale', $order++, VendorType::Freelance, $musicales);

        $artistiques = $this->create($manager, 'Artistiques', 'animations-artistiques', $order++, VendorType::Freelance, $animations);
        $this->create($manager, 'Live Sketching', 'live-sketching', $order++, VendorType::Freelance, $artistiques);
        $this->create($manager, 'Magicien', 'magicien', $order++, VendorType::Freelance, $artistiques);
        $this->create($manager, 'Calligraphe', 'calligraphe', $order++, VendorType::Freelance, $artistiques);
        $this->create($manager, 'Danseurs', 'danseurs', $order++, VendorType::Freelance, $artistiques);
        $this->create($manager, 'Caricature', 'caricature', $order++, VendorType::Freelance, $artistiques);

        $enfants = $this->create($manager, 'Enfants', 'animations-enfants', $order++, VendorType::Freelance, $animations);
        $this->create($manager, 'Babysitting', 'babysitting', $order++, VendorType::Freelance, $enfants);
        $this->create($manager, 'Animateur', 'animateur-enfants', $order++, VendorType::Freelance, $enfants);
        $this->create($manager, 'Conteur', 'conteur', $order++, VendorType::Freelance, $enfants);
        $this->create($manager, 'Atelier créatif', 'atelier-creatif', $order++, VendorType::Freelance, $enfants);

        $culinaires = $this->create($manager, 'Culinaires', 'animations-culinaires', $order++, VendorType::Freelance, $animations);
        $this->create($manager, 'Bar à cocktail', 'bar-a-cocktail', $order++, VendorType::Freelance, $culinaires);
        $this->create($manager, 'Candy bar', 'candy-bar', $order++, VendorType::Freelance, $culinaires);
        $this->create($manager, 'Foodtruck', 'foodtruck', $order++, VendorType::Freelance, $culinaires);
        $this->create($manager, 'Animations culinaires', 'animation-culinaire', $order++, VendorType::Freelance, $culinaires);

        // CRÉATEURS
        $createurs = $this->create($manager, 'Créateurs', 'createurs', $order++, VendorType::Createurs);
        $this->create($manager, 'Créatrice de robe de mariée', 'creatrice-robe-de-mariee', $order++, VendorType::Createurs, $createurs);
        $this->create($manager, 'Costumier / tailleur sur mesure', 'costumier-tailleur-sur-mesure', $order++, VendorType::Createurs, $createurs);
        $this->create($manager, 'Modiste', 'modiste', $order++, VendorType::Createurs, $createurs);
        $this->create($manager, 'Joaillerie', 'joaillerie', $order++, VendorType::Createurs, $createurs);
        $this->create($manager, 'Papeterie mariage', 'papeterie-mariage', $order++, VendorType::Createurs, $createurs);

        $manager->flush();
    }

    private function create(
        ObjectManager $manager,
        string $name,
        string $slug,
        int $sortOrder,
        VendorType $category,
        ?Service $parent = null,
    ): Service {
        $service = (new Service())
            ->setName($name)
            ->setSlug($slug)
            ->setSortOrder($sortOrder)
            ->setCategory($category)
            ->setParent($parent);

        $manager->persist($service);

        return $service;
    }
}
