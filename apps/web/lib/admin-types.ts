export type AdminVendorStatus = 'under_review' | 'active' | 'rejected'
export type AdminVendorFilter = AdminVendorStatus | 'all'

export type AdminSession = {
  email: string
  firstName: string
  lastName: string | null
  roles: string[]
}

export type RejectionReasonKey =
  | 'portfolio_quality'
  | 'legal_incomplete'
  | 'pricing_zones_incomplete'
  | 'description_insufficient'
  | 'other'

export type AdminVendorListItem = {
  id: string
  name: string
  vendorType: string
  vendorTypeLabel: string
  services: string[]
  submittedAt: string
  status: AdminVendorStatus
  statusLabel: string
}

export type AdminVendorListResponse = {
  items: AdminVendorListItem[]
  totalAll: number
  totalFiltered: number
}

export type NamedItem = {
  id: string
  name: string
  slug: string
}

export type ServiceItem = NamedItem & {
  category: string
}

export type PortfolioImage = {
  id: string
  url: string
  isCover: boolean
}

export type AdminVendorProfile = {
  id: string
  status: AdminVendorStatus
  statusLabel: string
  vendorType: string
  vendorTypeLabel: string
  submittedAt: string
  reviewedAt: string | null
  summary: {
    brandName: string
    firstName: string
    lastName: string | null
    email: string
    city: string | null
  }
  profession: {
    type: string
    services: ServiceItem[]
    description: string | null
  }
  experiences: {
    cultures: NamedItem[]
    confessions: NamedItem[]
  }
  zonesPricing: {
    regions: NamedItem[]
    priceMinCents: number
    priceMaxCents: number
    priceType: string
    priceTypeLabel: string
  }
  portfolio: PortfolioImage[]
  legal: {
    brandName: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    address: string | null
    zipcode: string | null
    city: string | null
    siret: string | null
    siretVerified: boolean
    legalName: string | null
    legalForm: string | null
    legalStatus: string | null
    incorporatedAt: string | null
  }
  specificDetails:
    | {
        type: 'venue'
        details: {
          venueType: string | null
          capacityMin: number | null
          capacityMax: number | null
          nearestCity: string | null
          distanceToCityMinutes: number | null
          hasCatering: boolean | null
          hasAccommodation: boolean | null
          hasOutdoorSpace: boolean | null
          hasCorkageFee: boolean | null
          hasToilets: boolean | null
          isPmrAccessible: boolean | null
        }
      }
    | {
        type: 'catering'
        details: {
          coversMin: number | null
          coversMax: number | null
          isKosher: boolean | null
          isHalal: boolean | null
          isVegan: boolean | null
          isGlutenFree: boolean | null
          offersTableService: boolean | null
          offersBuffet: boolean | null
          offersCocktail: boolean | null
          providesTableware: boolean | null
          providesFurniture: boolean | null
        }
      }
    | null
  rejection: {
    reasons: Array<{ key: RejectionReasonKey; label: string }>
    note: string | null
  } | null
}
