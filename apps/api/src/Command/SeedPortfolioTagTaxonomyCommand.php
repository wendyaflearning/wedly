<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\String\Slugger\SluggerInterface;

#[AsCommand(
    name: 'app:seed:portfolio-tags',
    description: 'Idempotent upsert of the portfolio TagType/TagValue taxonomy per service',
)]
class SeedPortfolioTagTaxonomyCommand extends Command
{
    /**
     * @var array<string, array{
     *     primary: array{label: string, values: list<string>, maxSelections?: int|null},
     *     optional: array<string, list<string>|array{values: list<string>, maxSelections: int}>,
     * }>
     */
    private const TAXONOMY = [
        'lieu-de-reception' => [
            'primary' => [
                'label' => 'Type de lieu',
                'values' => [
                    'Domaine', 'Château', 'Salle de réception', 'Restaurant privatisable',
                    'Hôtel', 'Péniche', 'Villa', 'Rooftop', 'Loft', 'Ferme', 'Lieu atypique',
                ],
            ],
            'optional' => [
                'Univers' => [
                    'Champêtre', 'Chic', 'Contemporain', 'Historique', 'Intimiste',
                    'Bohème', 'Élégant', 'Prestige', 'Insolite', 'Romantique',
                ],
                'Caractéristiques du lieu' => [
                    'Avec hébergement', 'En extérieur', 'En intérieur', 'Jardin', 'Terrasse',
                    'Piscine', 'Vue dégagée', 'Piste de danse', 'Espace cérémonie',
                    'Espace cocktail', 'Espace dîner', 'Parking', 'Accès PMR', 'Privatisation totale', 'Traiteur inclus'
                ],
            ],
        ],
        'traiteur' => [
            'primary' => [
                'label' => 'Type de prestation proposée',
                'values' => [
                    'Cocktail', 'Buffet', 'Repas assis', 'Brunch', 'Food truck',
                    'Animation culinaire', 'Dessert / wedding cake',
                ],
            ],
            'optional' => [
                'Type de cuisine' => [
                    'Française', 'Italienne', 'Asiatique', 'Africaine', 'Méditerranéenne',
                    'Libanaise / Orientale', 'Antillaise / Créole', 'Indienne',
                ],
                'Régimes alimentaires' => [
                    'Végétarienne', 'Vegan', 'Halal', 'Casher', 'Sans gluten', 'Sans lactose',
                ],
                'Mode de service' => [
                    'Service à table', 'Buffet libre', 'Cocktail dînatoire', 'Live cooking',
                    'Stand', 'Food station', 'Show cooking',
                ],
                'Moments servis' => [
                    "Vin d'honneur", 'Cocktail', 'Dîner', 'Brunch', 'Dessert', 'After party',
                ],
                'Style culinaire' => [
                    'Gastronomique', 'Convivial', 'Premium', 'Familial', 'Festif',
                    'Raffiné', 'Street food', 'Traditionnel',
                ],
            ],
        ],
        'photographe' => [
            'primary' => [
                'label' => 'Style visuel',
                'values' => [
                    'Reportage', 'Lifestyle', 'Fine art', 'Éditorial', 'Classique',
                    'Cinématographique', 'Lumineux', 'Contrasté', 'Noir et blanc fort', 'Naturel',
                ],
            ],
            'optional' => [
                'Rendu émotionnel' => [
                    'Spontané', 'Poétique', 'Élégant', 'Intime', 'Festif', 'Premium', 'Romantique', 'Authentique',
                ],
                'Durée & lieu' => [
                    'Journée complète', 'Demi-journée', 'Studio', 'Extérieur', "Shooting à l'étranger",
                ],
                'Moments couverts' => [
                    'Préparatifs des mariés', 'Mairie', 'Cérémonie', 'Séance couple',
                    'Cocktail', 'Photos de groupe', 'Soirée',
                ],
                'Techniques' => [
                    'Drone', 'Argentique', 'Polaroid',
                ],
                'Prestations complémentaires' => [
                    'Retouche fine', 'Album', 'Vidéo (si offre mixte photo + vidéo)',
                ],
            ],
        ],
        'maquillage' => [
            'primary' => [
                'label' => 'Type de prestation proposée',
                'values' => [
                    'Maquillage mariée', 'Maquillage invitée', 'Essai maquillage', 'Maquillage jour J', 'Accompagnement journée',
                ],
            ],
            'optional' => [
                'Style de maquillage' => [
                    'Naturel', 'Glowy', 'Nude', 'Sophistiqué', 'Glamour', 'Soft glam', 'Full glam', 'Editorial',
                ],
                'Univers / rendu' => [
                    'Lumineux', 'Élégant', 'Discret', 'Moderne', 'Romantique', 'Longue tenue', 'Waterproof',
                ],
                'Lieu de prestation' => [
                    'À domicile', 'Sur lieu', 'Studio', 'Salon', 'Déplacement',
                ],
                'Formule' => [
                    'Équipe', 'Prestation express', 'Accompagnement complet',
                ],
                'Expertises' => [
                    'Peau foncée', 'Peaux matures', 'Peaux sensibles', 'Teint impeccable',
                    'Mise en valeur naturelle', 'Glow de mariée', 'Faux cils', 'Correction teint',
                ],
            ],
        ],
        'animations-musicales' => [
            'primary' => [
                'label' => 'Instruments joués',
                'values' => ['Violon', 'Piano', 'Guitare', 'Saxophone', 'Voix', 'Harpe'],
            ],
            'optional' => [
                'Formation' => [
                    'values' => ['Soliste', 'Duo', 'Trio', 'Quatuor', 'Groupe live'],
                    'maxSelections' => 1,
                ],
                'Styles musicaux' => [
                    'Classique', 'Pop', 'Jazz', 'Gospel', 'Lounge', 'Bossa nova', 'Variété', 'Folk', 'Latino',
                ],
                'Moments de prestation' => [
                    'Cérémonie', "Vin d'honneur", 'Cocktail', 'Dîner', 'Soirée dansante',
                ],
                'Ambiance' => [
                    'Romantique', 'Élégante', 'Festive', 'Moderne', 'Intimiste',
                ],
            ],
        ],
        'dj' => [
            'primary' => [
                'label' => 'Style musical',
                'values' => [
                    'Généraliste', 'Afro', 'House', 'Funk', 'Disco', 'Latino',
                    'Orientale', 'Lounge', 'Pop', 'Électro', 'Rétro',
                ],
            ],
            'optional' => [
                'Ambiance / énergie' => [
                    'Chic', 'Festive', 'Élégante', 'Sobre', 'Dynamique', 'Premium', 'Conviviale', 'Très dansante',
                ],
                'Prestations incluses' => [
                    'DJ seul', 'DJ + animation micro', 'DJ + matériel son', 'DJ + lumière',
                    'DJ + coordination soirée', 'Présence du début à la fin',
                ],
                'Savoir-faire & animations' => [
                    'Transitions fluides', 'Mix sur mesure', 'Ouverture de bal', 'Blind test',
                    'Mix multiculturel', 'Gestion des temps forts', 'Animation bilingue',
                ],
            ],
        ],
        'creatrice-robe-de-mariee' => [
            'primary' => [
                'label' => 'Type de prestation proposée',
                'values' => [
                    'Robe de mariée', 'Robe civile', 'Seconde robe', 'Sur-mesure', 'Collection', 'Retouches', 'Accessoires',
                ],
            ],
            'optional' => [
                'Style' => [
                    'Bohème', 'Classique', 'Romantique', 'Moderne', 'Minimaliste', 'Couture', 'Vintage', 'Princesse',
                ],
                'Silhouette / coupe' => [
                    'Sirène', 'Fluide', 'Princesse', 'Fourreau', 'Empire', 'Courte', 'A-line', 'Dos nu', 'Manches longues',
                ],
                'Matières / finitions' => [
                    'Dentelle', 'Tulle', 'Satin', 'Crêpe', 'Broderies', 'Perles', 'Transparence', 'Effet seconde peau',
                ],
                'Accompagnement' => [
                    'Atelier', 'Sur rendez-vous', 'Accompagnement personnalisé', 'Essayages privés',
                    'Création sur mesure', 'Retouches incluses',
                ],
            ],
        ],
        'decoration' => [
            'primary' => [
                'label' => 'Style / thème',
                'values' => [
                    'Bohème', 'Champêtre', 'Chic', 'Romantique', 'Minimaliste', 'Contemporain',
                    'Vintage', 'Classique', 'Art déco', 'Tropical', 'Méditerranéen', 'Rustique',
                ],
            ],
            'optional' => [
                'Palette couleurs' => [
                    'Blanc cassé', 'Vert eucalyptus', 'Terracotta', 'Pastel', 'Doré', 'Beige', 'Noir', 'Bordeaux', 'Bleu nuit',
                ],
                'Matières visuelles' => [
                    'Bois', 'Lin', 'Verre', 'Métal', 'Bougie', 'Fleurs fraîches', 'Fleurs séchées', 'Macramé', 'Pampa', 'Velours',
                ],
                'Moments décorés' => [
                    'Cérémonie', 'Cocktail', 'Dîner', 'Soirée', 'Entrée', 'Table', 'Plafond/suspension', 'Extérieur',
                ],
                'Éléments signature' => [
                    'Arche', 'Centre de table', 'Fond de cérémonie', 'Panneau de bienvenue', 'Plan de table',
                    "Table d'honneur", 'Coin photo', 'Signalétique', 'Seating plan',
                ],
            ],
        ],
        'coordinatrice-mariage' => [
            'primary' => [
                'label' => "Type d'accompagnement",
                'values' => [
                    'Coordination jour J', 'Coordination partielle', 'Coordination complète',
                    'Accompagnement du planning', 'Présence sur place',
                ],
            ],
            'optional' => [
                "Périmètre d'intervention" => [
                    'Rétroplanning', 'Gestion prestataires', 'Contact prestataires', 'Accueil invités',
                    'Gestion timing', 'Installation', 'Désinstallation', 'Suivi des imprévus',
                    'Coordination cérémonie', 'Coordination réception',
                ],
                'Expertise / spécialités' => [
                    'Mariages multiculturels', 'Mariages à grand nombre', 'Coordination destination wedding',
                    'Gestion de planning complexe', 'Coordination de cérémonie laïque', "Coordination d'équipes nombreuses",
                ],
            ],
        ],
        'tailleur-homme' => [
            'primary' => [
                'label' => 'Type de tenue',
                'values' => [
                    'Costume mariage', 'Smoking', 'Costume sur-mesure', 'Costume 2 pièces', 'Costume 3 pièces', 'Cérémonie',
                ],
            ],
            'optional' => [
                'Coupe / construction' => [
                    '2 pièces', '3 pièces', 'Sur-mesure', 'Ajusté', 'Dépareillé',
                ],
                'Style' => [
                    'Chic', 'Classique', 'Moderne', 'Élégant', 'Black tie', 'Champêtre', 'Minimaliste', 'Contemporain',
                ],
                'Matières' => [
                    'Laine froide', 'Lin', 'Coton', 'Velours', 'Tweed', 'Mélange léger',
                ],
                'Accompagnement' => [
                    'Rendez-vous privé', 'Sur mesure', 'Essayage à domicile', 'Retouches incluses',
                    'Conseil morphologie', 'Accompagnement accessoirisation',
                ],
            ],
        ],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ServiceRepository $serviceRepository,
        private readonly SluggerInterface $slugger,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Seeding portfolio tag taxonomy');

        $tagTypesCreated = 0;
        $tagTypesUpdated = 0;
        $tagTypesDeleted = 0;
        $tagValuesCreated = 0;
        $tagValuesUpdated = 0;
        $tagValuesDeleted = 0;

        foreach (self::TAXONOMY as $serviceSlug => $definition) {
            $service = $this->serviceRepository->findOneBy(['slug' => $serviceSlug]);

            if ($service === null) {
                $io->error(sprintf('Service not found: slug="%s". Aborting.', $serviceSlug));

                return Command::FAILURE;
            }

            // Flatten primary + optional TagType definitions: label => [values, isPrimary, maxSelections]
            $tagTypeCatalog = [
                $definition['primary']['label'] => [
                    'values' => $definition['primary']['values'],
                    'isPrimary' => true,
                    'maxSelections' => $definition['primary']['maxSelections'] ?? null,
                ],
            ];

            foreach ($definition['optional'] as $label => $optionalDef) {
                // Optional entries are either a plain value list, or ['values' => ..., 'maxSelections' => ...]
                // when a selection cap applies (e.g. "Formation" for animations-musicales, max 1).
                $tagTypeCatalog[$label] = [
                    'values' => $optionalDef['values'] ?? $optionalDef,
                    'isPrimary' => false,
                    'maxSelections' => $optionalDef['maxSelections'] ?? null,
                ];
            }

            // Index existing optional TagType for this service by slug of their label. The primary
            // TagType is tracked separately: a DB constraint (UNIQ_TAG_TYPE_SERVICE_PRIMARY) allows
            // only one is_primary=true row per service regardless of is_active, so it must be matched
            // by that flag and updated in place — matching it by label slug like the optional entries
            // would try to insert a second primary row whenever the primary label changes.
            $existingTagTypes = [];
            $existingPrimaryTagType = null;
            foreach ($service->getTagTypes() as $tagType) {
                if ($tagType->isPrimary()) {
                    $existingPrimaryTagType = $tagType;
                    continue;
                }
                $existingTagTypes[$this->toSlug($tagType->getLabel())] = $tagType;
            }

            $catalogTagTypeSlugs = [];

            foreach ($tagTypeCatalog as $label => $tagTypeDef) {
                $slug = $this->toSlug($label);

                if (isset($catalogTagTypeSlugs[$slug])) {
                    $io->error(sprintf(
                        'Intra-service TagType slug collision on service "%s": slug "%s" generated twice (from "%s" and "%s"). Aborting.',
                        $serviceSlug,
                        $slug,
                        $catalogTagTypeSlugs[$slug],
                        $label,
                    ));

                    return Command::FAILURE;
                }

                $catalogTagTypeSlugs[$slug] = $label;

                $matchedTagType = $tagTypeDef['isPrimary'] ? $existingPrimaryTagType : ($existingTagTypes[$slug] ?? null);

                if ($matchedTagType !== null) {
                    $tagType = $matchedTagType;
                    $tagType->setLabel($label)
                        ->setIsPrimary($tagTypeDef['isPrimary'])
                        ->setMaxSelections($tagTypeDef['maxSelections'])
                        ->setIsActive(true);
                    ++$tagTypesUpdated;
                } else {
                    $tagType = (new TagType())
                        ->setService($service)
                        ->setLabel($label)
                        ->setIsPrimary($tagTypeDef['isPrimary'])
                        ->setMaxSelections($tagTypeDef['maxSelections'])
                        ->setIsActive(true);

                    $this->em->persist($tagType);
                    ++$tagTypesCreated;
                }

                // Index existing TagValue for this TagType by slug of their label
                $existingTagValues = [];
                foreach ($tagType->getTagValues() as $tagValue) {
                    $existingTagValues[$this->toSlug($tagValue->getLabel())] = $tagValue;
                }

                $catalogTagValueSlugs = [];

                foreach ($tagTypeDef['values'] as $valueLabel) {
                    $valueSlug = $this->toSlug($valueLabel);

                    if (isset($catalogTagValueSlugs[$valueSlug])) {
                        $io->error(sprintf(
                            'Intra-TagType TagValue slug collision on service "%s" / TagType "%s": slug "%s" generated twice (from "%s" and "%s"). Aborting.',
                            $serviceSlug,
                            $label,
                            $valueSlug,
                            $catalogTagValueSlugs[$valueSlug],
                            $valueLabel,
                        ));

                        return Command::FAILURE;
                    }

                    $catalogTagValueSlugs[$valueSlug] = $valueLabel;

                    if (isset($existingTagValues[$valueSlug])) {
                        $existingTagValues[$valueSlug]->setLabel($valueLabel)->setIsActive(true);
                        ++$tagValuesUpdated;
                    } else {
                        $tagValue = (new TagValue())
                            ->setTagType($tagType)
                            ->setLabel($valueLabel)
                            ->setIsActive(true);

                        $this->em->persist($tagValue);
                        ++$tagValuesCreated;
                    }
                }

                // Delete TagValue present in DB but absent from catalog for this TagType. No vendor
                // uses this feature in production yet, so a hard delete keeps the taxonomy table
                // clean instead of accumulating dead rows behind is_active=false. If a TagValue is
                // ever actually referenced by a portfolio_image_tag row, the FK constraint aborts
                // the flush rather than silently orphaning real vendor data.
                foreach ($existingTagValues as $valueSlug => $tagValue) {
                    if (!isset($catalogTagValueSlugs[$valueSlug])) {
                        $this->em->remove($tagValue);
                        ++$tagValuesDeleted;
                    }
                }
            }

            // Delete TagType (and its remaining TagValue rows) present in DB but absent from
            // catalog for this service — same hard-delete rationale as above.
            foreach ($existingTagTypes as $slug => $tagType) {
                if (!isset($catalogTagTypeSlugs[$slug])) {
                    foreach ($tagType->getTagValues() as $tagValue) {
                        $this->em->remove($tagValue);
                        ++$tagValuesDeleted;
                    }
                    $this->em->remove($tagType);
                    ++$tagTypesDeleted;
                }
            }
        }

        $this->em->flush();

        $io->success(sprintf(
            'Done. TagType — Created: %d | Updated: %d | Deleted: %d. TagValue — Created: %d | Updated: %d | Deleted: %d',
            $tagTypesCreated,
            $tagTypesUpdated,
            $tagTypesDeleted,
            $tagValuesCreated,
            $tagValuesUpdated,
            $tagValuesDeleted,
        ));

        return Command::SUCCESS;
    }

    private function toSlug(string $label): string
    {
        return $this->slugger->slug($label)->lower()->toString();
    }
}
