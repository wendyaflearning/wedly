export type AdminVendorStatus = 'pending' | 'under_review' | 'active' | 'rejected'
export type AdminVendorFilter = Exclude<AdminVendorStatus, 'pending'> | 'all'
export type AdminVendorInvitationScope = 'active' | 'expired'

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

export type AdminVendorInvitation = {
  id: string
  token: string
  vendorId: string
  brandName: string
  firstname: string
  email: string
  createdAt: string
  expiresAt: string
  service: {
    id: string | null
    name: string
  }
  regions: Array<{
    id: string
    name: string
  }>
}

export type AdminVendorInvitationListResponse = {
  items: AdminVendorInvitation[]
  total: number
}

export type AdminVendorDraftListResponse = {
  items: AdminVendorListItem[]
  total: number
}

export type AdminVendorDraft = {
  id: string
  status: string
  invitation: {
    id: string
    token: string
    status: string
    expiresAt: string
  } | null
  identity: {
    firstname: string
    lastName: string | null
    email: string
    brandName: string
  }
  profession: {
    serviceId: string | null
  }
  experiences: {
    cultureIds: string[]
    confessionIds: string[]
  }
  zonesPricing: {
    regions: string[]
    priceMin: number | null
    priceMax: number | null
    priceType: string
    city: string | null
  }
  portfolio: PortfolioImage[]
  legalInfo: {
    phone: string | null
    address: string | null
    zipcode: string | null
    city: string | null
    siret: string | null
  }
  venueCharacteristics: {
    venueType: string
    capacityMin: number | null
    capacityMax: number | null
    hasCatering: boolean
    hasAccommodation: boolean
    hasOutdoorSpace: boolean
    hasCorkageFee: boolean
    hasToilets: boolean
    isPmrAccessible: boolean
    nearestCity: string | null
    distanceToCityMinutes: number | null
  } | null
  cateringCharacteristics: {
    coversMin: number | null
    coversMax: number | null
    isKosher: boolean
    isHalal: boolean
    isVegan: boolean
    isGlutenFree: boolean
    offersTableService: boolean
    offersBuffet: boolean
    offersCocktail: boolean
    providesTableware: boolean
    providesFurniture: boolean
  } | null
}

export type AdminVendorInvitationSendResponse = {
  vendorId: string
  inviteToken: string
  invitationUrl: string
  emailSent: boolean
}

export type AdminCreatedVendorResponse = AdminVendorDraft

export type ExperienceOption = {
  id: string
  name: string
}

export type CultureOption = ExperienceOption & {
  slug?: string
  type?: string
}

export type ConfessionOption = ExperienceOption & {
  slug?: string
}

export type ServiceOptionNode = {
  id: string
  name: string
  slug?: string
  category?: string
  children: ServiceOptionNode[]
}

export type RegionOption = {
  id: string
  name: string
}

export type NamedItem = {
  id: string
  name: string
  slug: string
}

export type ServiceItem = NamedItem & {
  category: string
}

export type TagOption = { id: string; name: string; slug: string }
export type StyleOption = TagOption
export type SpecialtyOption = TagOption & { serviceId: string }

export type PortfolioImage = {
  id: string
  url: string
  isCover: boolean
  styles: TagOption[]
  specialties: TagOption[]
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
