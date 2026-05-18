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


export interface ServiceOption {
  id: string
  name: string
}

export interface ExperienceOption {
  id: string
  name: string
}

export interface OnboardingStep {
  stepKey: string
  label: string
  order: number
  status: 'pending' | 'current' | 'completed'
  isPreFilled: boolean
}

export interface OnboardingOverviewData {
  firstname: string
  steps: OnboardingStep[]
  steps_data?: {
    professions?: { services: ServiceOption[] }
    experiences?: {
      confession_ids: ExperienceOption[]
      culture_ids: ExperienceOption[]
    }
    venue_characteristics?: Pick<
      VenueDetails,
      'venue_type' | 'capacity_min' | 'capacity_max' | 'has_catering' | 'has_accommodation' | 'has_outdoor_space' | 'is_pmr_accessible'
    >
  }
}