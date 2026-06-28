const bioSuggestions = {
  Photographe: {
    style: "Lumineux et documentaire — je capte ce que les autres ne voient plus.",
    mariage: "Provence, 38°C, des mariés qui riaient aux larmes. Ces images restent en moi.",
    unique: "Je ne pose jamais mes couples. J'attends qu'ils oublient que j'existe.",
  },
  Traiteur: {
    style: "Une cuisine généreuse et précise — qui sent la maison et surprend les palais.",
    mariage: "300 couverts, trois générations, un méchoui à minuit. Tout le monde est resté.",
    unique: "Je rencontre chaque couple avant de concevoir le menu. Rien n'est générique.",
  },
  Lieu: {
    style: "Un domaine du XVIIIe pour des mariages intimes — la pierre, la lumière du soir.",
    mariage: "Une cérémonie en janvier, des bougies, le froid dehors. Un moment suspendu.",
    unique: "Un seul mariage par week-end. Votre jour est vraiment le vôtre.",
  },
  Createur: {
    style: "Matières, couleurs, silhouettes — chaque détail construit un univers cohérent.",
    mariage: "Un couple qui ne savait pas comment dire ce qu'il voulait. On l'a dessiné ensemble.",
    unique: "Je ne reproduis jamais. Chaque création repart de zéro, à partir de vous.",
  },
  Animateur: {
    style: "Je lis la salle et j'adapte en temps réel — l'émotion d'abord, la technique ensuite.",
    mariage: "Trois générations sur le même dancefloor. Ce soir-là, tout le monde était là.",
    unique: "Je rencontre chaque couple avant le jour J. Rien d'improvisé, tout semble naturel.",
  },
}

type SuggestionKey = keyof typeof bioSuggestions

export type BioSuggestions = {
  style: string
  mariage: string
  unique: string
}

// Mapping explicite slug → clé de suggestion.
// Les slugs correspondent à resolveVendorServices() côté API.
const slugToKey: Partial<Record<string, SuggestionKey>> = {
  'photographe':            'Photographe',
  'photographie':           'Photographe',
  'videaste':               'Photographe',
  'traiteur':               'Traiteur',
  'lieu-de-reception':      'Lieu',
  'createurs':              'Createur',
  'fleuriste':              'Createur',
  'animations':             'Animateur',
  'animations-musicales':   'Animateur',
  'animations-artistiques': 'Animateur',
  'animateur':              'Animateur',
  'animateur-enfants':      'Animateur',
  'dj':                     'Animateur',
}

export function getSuggestionsForVendorServices(services: string[]): BioSuggestions {
  for (const slug of services) {
    const key = slugToKey[slug.trim().toLowerCase()]
    if (key) return bioSuggestions[key]
  }
  return bioSuggestions.Photographe
}
