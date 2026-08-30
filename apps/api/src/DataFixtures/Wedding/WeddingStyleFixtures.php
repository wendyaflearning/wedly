<?php

declare(strict_types=1);

namespace App\DataFixtures\Wedding;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Plan\Plan;
use App\Entity\Wedding\WeddingStyle;
use App\Enum\Wedding\CultureType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class WeddingStyleFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $this->loadStyles($manager);
        $this->loadCultures($manager);
        $this->loadConfessions($manager);
        $this->loadPlans($manager);

        $manager->flush();
    }

    private function loadStyles(ObjectManager $manager): void
    {
        $styles = [
            ['Bohème',     'boheme',     'Style naturel, esprit libre, guirlandes et fleurs sauvages.'],
            ['Champêtre',  'champetre',  'Décor bucolique à la campagne, bois brut et lin.'],
            ['Chic',       'chic',       'Élégance raffinée, fleurs blanches et vaisselle dorée.'],
            ['Moderne',    'moderne',    'Lignes épurées, palette neutre et mobilier contemporain.'],
            ['Vintage',    'vintage',    'Charme rétro, vaisselle dépareillée et dentelle.'],
            ['Classique',  'classique',  'Tradition et sobriété, cérémonie solennelle.'],
            ['Romantique', 'romantique', 'Roses, bougies et drapés en organza.'],
            ['Exotique',   'exotique',  'Couleurs vives, épices et motifs du monde entier.'],
        ];

        foreach ($styles as [$name, $slug, $description]) {
            $style = new WeddingStyle();
            $style->setName($name)
                ->setSlug($slug)
                ->setDescription($description);
            $manager->persist($style);
        }
    }

    private function loadCultures(ObjectManager $manager): void
    {
        $continents = [
            ['Europe',        'europe'],
            ['Afrique',       'afrique'],
            ['Asie',          'asie'],
            ['Amérique',      'amerique'],
            ['Moyen-Orient',  'moyen-orient'],
            ['Océanie',       'oceanie'],
            // Pas un continent au sens strict, mais c'est ainsi que la
            // migration de seed d'origine (Version20260418160000) l'a
            // classé, et GET /api/v1/cultures (côté onboarding/profil
            // vendor, App\Controller\Culture\GetCulturesAction) ne renvoie
            // que ce type — le fixture doit matcher la prod, pas une
            // taxonomie idéale.
            ['Maghreb',       'maghreb'],
        ];

        foreach ($continents as [$name, $slug]) {
            $culture = new Culture();
            $culture->setName($name)->setSlug($slug)->setType(CultureType::Continent);
            $manager->persist($culture);
        }

        // L'option "aucune spécialité" du parcours couple (WED-107) : absente
        // tant qu'un couple ne choisit pas un pays ou un continent précis, et
        // n'a pas vocation à apparaître dans la liste "continents" ci-dessus.
        $other = [
            ['Aucune spécialité culturelle', 'aucune-specialite-culturelle'],
        ];

        foreach ($other as [$name, $slug]) {
            $culture = new Culture();
            $culture->setName($name)->setSlug($slug)->setType(CultureType::Autre);
            $manager->persist($culture);
        }

        $countries = [
            ['France',      'france'],
            ['Maroc',       'maroc'],
            ['Algérie',     'algerie'],
            ['Tunisie',     'tunisie'],
            ['Sénégal',     'senegal'],
            ['Côte d\'Ivoire', 'cote-divoire'],
            ['Portugal',    'portugal'],
            ['Italie',      'italie'],
            ['Espagne',     'espagne'],
            ['Turquie',     'turquie'],
            ['Liban',       'liban'],
            ['Chine',       'chine'],
            ['Inde',        'inde'],
        ];

        foreach ($countries as [$name, $slug]) {
            $culture = new Culture();
            $culture->setName($name)->setSlug($slug)->setType(CultureType::Country);
            $manager->persist($culture);
        }
    }

    private function loadConfessions(ObjectManager $manager): void
    {
        $confessions = [
            ['Laïc',         'laic'],
            ['Catholique',   'catholique'],
            ['Musulman',     'musulman'],
            ['Juif',         'juif'],
            ['Protestant',   'protestant'],
            ['Orthodoxe',    'orthodoxe'],
            ['Bouddhiste',   'bouddhiste'],
            ['Hindou',       'hindou'],
            ['Mixte',        'mixte'],
            ['Aucune spécialité religieuse', 'aucune-specialite-religieuse'],
        ];

        foreach ($confessions as [$name, $slug]) {
            $confession = new Confession();
            $confession->setName($name)->setSlug($slug);
            $manager->persist($confession);
        }
    }

    private function loadPlans(ObjectManager $manager): void
    {
        $plans = [
            // name, price_cents, service_count
            ['découverte', 900,  1],
            ['essentiel',  2900, 3],
            ['premium',    9900, -1],
        ];

        foreach ($plans as [$name, $priceCents, $serviceCount]) {
            $plan = new Plan();
            $plan->setName($name)
                ->setPriceCents($priceCents)
                ->setServiceCount($serviceCount)
                ->setIsActive(true);
            $manager->persist($plan);
        }
    }
}
