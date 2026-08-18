export type CategoryBubble = {
  slug: string;
  label: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  size: "lg" | "sm";
};

// Ordre = disposition de la maquette v4 (variante "Rangées de 3", par défaut) :
// 1 rangée de 2 grandes bulles, 2 rangées de 3 petites bulles, 1 bulle finale isolée.
export const CATEGORY_BUBBLES: CategoryBubble[] = [
  {
    slug: "lieu-de-reception",
    label: "Lieu de réception",
    tagline: "Châteaux, domaines, salles atypiques",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060435/lieu_de_reception_sh86ky.jpg",
    imageAlt: "Lieu de réception",
    size: "lg",
  },
  {
    slug: "traiteur",
    label: "Traiteur",
    tagline: "Menus sur-mesure, dégustations",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060435/traiteur_zbbqrt.jpg",
    imageAlt: "Traiteur",
    size: "lg",
  },
  {
    slug: "photographe",
    label: "Photographe",
    tagline: "Reportage, portraits, albums",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060435/photographe_t3qum2.jpg",
    imageAlt: "Photographe",
    size: "sm",
  },
  {
    slug: "creatrice-de-robe",
    label: "Créatrice de robe",
    tagline: "Sur-mesure et retouches",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060434/creatrice_robe_mariee_ainhme.jpg",
    imageAlt: "Créatrice de robe",
    size: "sm",
  },
  {
    slug: "coordinatrice",
    label: "Coordinatrice",
    tagline: "Jour J et logistique",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060435/coordinatrice_t13zca.jpg",
    imageAlt: "Coordinatrice",
    size: "sm",
  },
  {
    slug: "dj",
    label: "DJ",
    tagline: "Ambiance et animation",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060434/dj_zrcsh9.jpg",
    imageAlt: "DJ",
    size: "sm",
  },
  {
    slug: "decoration",
    label: "Décoration",
    tagline: "Scénographie et fleurs",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060434/decoration_ayhjgy.jpg",
    imageAlt: "Décoration",
    size: "sm",
  },
  {
    slug: "mua",
    label: "MUA",
    tagline: "Maquillage et coiffure",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060433/makeup_atrtist_xieyqy.jpg",
    imageAlt: "MUA",
    size: "sm",
  },
  {
    slug: "tailleur-homme",
    label: "Tailleur homme",
    tagline: "Costumes sur-mesure",
    imageUrl: "https://res.cloudinary.com/dadvrspox/image/upload/v1787060433/tailleur_homme_swxsdh.jpg",
    imageAlt: "Tailleur homme",
    size: "sm",
  },
];
