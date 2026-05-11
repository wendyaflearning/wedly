export interface VenueDetails {
  venue_type: string | null
  capacity_min: number | null
  capacity_max: number | null
  has_catering: boolean | null
  has_accommodation: boolean | null
  has_outdoor_space: boolean | null
  has_corkage_fee: boolean | null
  has_toilets: boolean | null
  is_pmr_accessible: boolean | null
  distance_to_city_minutes: number | null
  nearest_city: string | null
}

export interface CateringDetails {
  covers_min: number | null
  covers_max: number | null
  is_kosher: boolean | null
  is_halal: boolean | null
  is_vegan: boolean | null
  is_gluten_free: boolean | null
  is_offers_table_service: boolean | null
  is_offers_buffet: boolean | null
  is_offers_cocktail: boolean | null
  is_provide_tableware: boolean | null
  is_provide_furniture: boolean | null
}

export interface OnboardingData {
  firstname: string
  onboarding_step: string | null
  vendor_category: 'freelance' | 'lieu' | 'traiteur' | null
  services: string[]
  confessions: string[]
  cultures: string[]
  zones: string[]
  price_min: number
  price_max: number
  price_type: string
  portfolio: {
    cover: string | null
    images: string[]
  }
  legal_information: {
    brand_name: string | null
    phone: string | null
    address: string | null
    siret: string | null
  }
  email: string
  venue_details: VenueDetails | null
  catering_details: CateringDetails | null
}
