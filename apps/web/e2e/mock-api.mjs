import http from 'node:http'

const port = Number(process.env.MOCK_API_PORT ?? 4010)

const services = [
  { id: 'service-photo', name: 'Photographe', children: [] },
  { id: 'service-dj', name: 'DJ', children: [] },
  { id: 'service-createur', name: 'Createur de robes', children: [] },
  {
    id: 'service-traiteur',
    name: 'Traiteur',
    children: [
      { id: 'service-cocktail', name: 'Cocktail', children: [] },
      { id: 'service-diner', name: 'Diner assis', children: [] },
    ],
  },
  { id: 'service-lieu', name: 'Lieu de reception', children: [] },
]

const cultures = [
  { id: 'culture-france', name: 'France' },
  { id: 'culture-maroc', name: 'Maroc' },
  { id: 'culture-senegal', name: 'Senegal' },
]

const confessions = [
  { id: 'confession-laique', name: 'Laique' },
  { id: 'confession-catholique', name: 'Catholique' },
  { id: 'confession-musulmane', name: 'Musulmane' },
]

const regions = [
  { id: 'region-idf', name: 'Ile-de-France' },
  { id: 'region-na', name: 'Nouvelle-Aquitaine' },
]

const legacySteps = [
  step('professions', 'Professions', 1),
  step('consent', 'Consentement', 2),
  step('experiences', 'Experiences', 3),
  step('zones_pricing', 'Zones et tarifs', 4),
  step('legal_info', 'Informations legales', 5),
  step('credentials', 'Connexion', 6),
]

const freelanceSteps = [
  step('professions', 'Professions', 1),
  step('consent', 'Consentement', 2),
  step('experiences', 'Experiences', 3),
  step('zones_pricing', 'Zones et tarifs', 4),
  step('portfolio', 'Portfolio', 5),
  step('legal_info', 'Informations legales', 6),
  step('credentials', 'Connexion', 7),
]

const cateringSteps = [
  step('professions', 'Professions', 1),
  step('consent', 'Consentement', 2),
  step('experiences', 'Experiences', 3),
  step('catering_characteristics', 'Caracteristiques traiteur', 4),
  step('zones_pricing', 'Zones et tarifs', 5),
  step('portfolio', 'Portfolio', 6),
  step('legal_info', 'Informations legales', 7),
  step('credentials', 'Connexion', 8),
]

const venueSteps = [
  step('professions', 'Professions', 1),
  step('venue_characteristics', 'Caracteristiques lieu', 2),
  step('zones_pricing', 'Zones et tarifs', 3),
  step('portfolio', 'Portfolio', 4),
  step('legal_info', 'Informations legales', 5),
  step('credentials', 'Connexion', 6),
]

const state = {
  requests: [],
  sessions: {},
  portfolioUploads: {},
}

/** Shared couple credentials for Mon espace E2E (WED-217). */
const COUPLE_E2E = {
  email: 'couple@example.test',
  password: 'couple-password',
  token: 'couple-e2e-jwt',
  session: {
    id: 'couple-e2e-id',
    firstName: 'Camille',
    lastName: 'Martin',
    email: 'couple@example.test',
  },
}

function step(stepKey, label, order) {
  return { stepKey, label, order, status: 'pending', isFilled: false }
}

function overviewForToken(token) {
  if (isSessionToken(token)) {
    return overviewForSession(sessionForToken(token))
  }

  const steps = legacySteps.map(item => ({ ...item }))
  const setStep = (stepKey, patch) => {
    const item = steps.find(candidate => candidate.stepKey === stepKey)
    if (item) Object.assign(item, patch)
  }

  if (token === 'consent-token') {
    setStep('professions', { status: 'completed', isFilled: true })
    setStep('consent', { status: 'current', isFilled: false })
    return overview(steps, {
      professions: { services: [{ id: 'service-photo', name: 'Photographe' }] },
    })
  }

  if (token === 'catering-consent-token') {
    const cateringConsentSteps = cateringSteps.map(item => ({ ...item }))
    for (const item of cateringConsentSteps) {
      if (item.stepKey === 'professions') Object.assign(item, { status: 'completed', isFilled: true })
      if (item.stepKey === 'consent') Object.assign(item, { status: 'current', isFilled: false })
    }
    return overview(cateringConsentSteps, {
      professions: { services: [{ id: 'service-traiteur', name: 'Traiteur' }] },
    }, 'traiteur')
  }

  if (token === 'experiences-token') {
    setStep('professions', { status: 'completed', isFilled: true })
    setStep('consent', { status: 'completed', isFilled: true })
    setStep('experiences', { status: 'current', isFilled: false })
    return overview(steps, {
      professions: { services: [{ id: 'service-photo', name: 'Photographe' }] },
      experiences: { culture_ids: [], confession_ids: [] },
    })
  }

  if (token === 'credentials-incomplete-token') {
    setStep('professions', { status: 'pending', isFilled: false })
    setStep('consent', { status: 'completed', isFilled: true })
    setStep('experiences', { status: 'pending', isFilled: false })
    setStep('zones_pricing', { status: 'completed', isFilled: true })
    setStep('legal_info', { status: 'completed', isFilled: true })
    setStep('credentials', { status: 'current', isFilled: false })
    return overview(steps, {
      credentials: { email: 'marie@example.test' },
    })
  }

  if (token === 'credentials-complete-token') {
    for (const item of steps) {
      item.status = 'completed'
      item.isFilled = true
    }
    setStep('credentials', { status: 'current', isFilled: false })
    return overview(steps, {
      professions: { services: [{ id: 'service-photo', name: 'Photographe' }] },
      experiences: {
        culture_ids: [{ id: 'culture-france', name: 'France' }],
        confession_ids: [{ id: 'confession-laique', name: 'Laique' }],
      },
      zones_pricing: {
        price_min: 120000,
        price_max: 250000,
        price_type: 'per_service',
        zones: ['region-idf'],
      },
      legal_info: {
        brand_name: 'Studio Lumiere',
        first_name: 'Marie',
        last_name: 'Durand',
        siret: '12345678901234',
      },
      credentials: { email: 'marie@example.test' },
    })
  }

  for (const item of steps) {
    item.status = item.stepKey === 'professions' ? 'current' : 'pending'
  }
  return overview(steps)
}

function isSessionToken(token) {
  return [
    'full-flow-token',
    'catering-full-flow-token',
    'venue-full-flow-token',
    'creator-full-flow-token',
    'portfolio-token',
  ].includes(token)
}

function sessionForToken(token) {
  if (!state.sessions[token]) {
    const config = sessionConfig(token)
    state.sessions[token] = {
      currentStep: config.currentStep,
      data: { ...config.initialData },
      steps: config.steps,
      vendorType: config.vendorType,
    }
    if (config.initialData.portfolio) {
      state.portfolioUploads[token] = config.initialData.portfolio.images
    }
  }
  return state.sessions[token]
}

function sessionConfig(token) {
  if (token === 'catering-full-flow-token') {
    return {
      steps: cateringSteps,
      vendorType: 'traiteur',
      currentStep: 'professions',
      initialData: { portfolio: prefilledPortfolio() },
    }
  }
  if (token === 'venue-full-flow-token') {
    return {
      steps: venueSteps,
      vendorType: 'lieu',
      currentStep: 'professions',
      initialData: { portfolio: prefilledPortfolio() },
    }
  }
  if (token === 'creator-full-flow-token') {
    return {
      steps: freelanceSteps,
      vendorType: 'createurs',
      currentStep: 'professions',
      initialData: { portfolio: prefilledPortfolio() },
    }
  }
  if (token === 'portfolio-token') {
    return {
      steps: freelanceSteps,
      vendorType: 'freelance',
      currentStep: 'portfolio',
      initialData: {},
    }
  }
  return {
    steps: freelanceSteps,
    vendorType: 'freelance',
    currentStep: 'professions',
    initialData: { portfolio: prefilledPortfolio() },
  }
}

function prefilledPortfolio() {
  return {
    images: [
      { id: 'portfolio-cover', url: 'https://example.test/portfolio-cover.jpg', is_cover: true, sort_order: 0 },
      { id: 'portfolio-2', url: 'https://example.test/portfolio-2.jpg', is_cover: false, sort_order: 1 },
      { id: 'portfolio-3', url: 'https://example.test/portfolio-3.jpg', is_cover: false, sort_order: 2 },
    ],
  }
}

function overviewForSession(session) {
  const steps = session.steps.map(item => {
    const isFilled = Boolean(session.data[item.stepKey])
    return {
      ...item,
      isFilled,
      status: item.stepKey === session.currentStep ? 'current' : isFilled ? 'completed' : 'pending',
    }
  })

  return overview(steps, {
    professions: session.data.professions
      ? { services: servicesFromIds(session.data.professions.service_ids ?? []) }
      : undefined,
    experiences: session.data.experiences
      ? {
          culture_ids: optionsFromIds(cultures, session.data.experiences.culture_ids ?? []),
          confession_ids: optionsFromIds(confessions, session.data.experiences.confession_ids ?? []),
        }
      : undefined,
    venue_characteristics: session.data.venue_characteristics,
    catering_characteristics: session.data.catering_characteristics,
    zones_pricing: session.data.zones_pricing,
    portfolio: session.data.portfolio,
    legal_info: session.data.legal_info,
    credentials: session.data.credentials
      ? { email: session.data.credentials.email }
      : undefined,
  }, session.vendorType)
}

function optionsFromIds(options, ids) {
  return ids
    .map(id => options.find(option => option.id === id))
    .filter(Boolean)
}

function servicesFromIds(ids) {
  const flattened = flattenServices(services)
  return optionsFromIds(flattened, ids)
}

function flattenServices(nodes) {
  return nodes.flatMap(node => [node, ...flattenServices(node.children ?? [])])
}

function overview(steps, stepsData = {}, vendorType = 'freelance') {
  return {
    firstname: 'Marie',
    vendor_type: vendorType,
    steps,
    steps_data: stepsData,
  }
}

function jsonResponse(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function jsonResponseWithCookie(res, status, payload, cookie) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Set-Cookie': cookie,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function tokenFromCookie(req) {
  const cookie = req.headers.cookie ?? ''
  const match = cookie.match(/jwt_token=([^;]+)/)
  return match?.[1] ?? null
}

function isCoupleToken(token) {
  return token === COUPLE_E2E.token
}

function emptyResponse(res, status = 204) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end()
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function readJson(req) {
  const raw = (await readBody(req)).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function nextStepForPatch(token, body) {
  const session = state.sessions[token]
  if (session) {
    if (body.step === 'consent' && !body.data?.granted) {
      const sensitiveIndex = session.steps.findIndex(item => item.stepKey === 'experiences')
      const fallback = session.steps.find((item, index) => index > sensitiveIndex && item.stepKey !== 'experiences')
      return fallback?.stepKey ?? 'completed'
    }
    const index = session.steps.findIndex(item => item.stepKey === body.step)
    return session.steps[index + 1]?.stepKey ?? 'completed'
  }

  if (body.step === 'professions') return 'consent'
  if (token === 'catering-consent-token' && body.step === 'consent' && !body.data?.granted) {
    return 'catering_characteristics'
  }
  if (body.step === 'consent') return body.data?.granted ? 'experiences' : 'zones_pricing'
  if (body.step === 'experiences') return 'zones_pricing'
  if (body.step === 'catering_characteristics') return 'zones_pricing'
  if (body.step === 'zones_pricing') return 'legal_info'
  if (body.step === 'legal_info') return 'credentials'
  return 'completed'
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    emptyResponse(res)
    return
  }

  if (req.method === 'GET' && url.pathname === '/__mock/health') {
    jsonResponse(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && url.pathname === '/__mock/reset') {
    state.requests = []
    state.sessions = {}
    state.portfolioUploads = {}
    jsonResponse(res, 200, { ok: true })
    return
  }

  if (req.method === 'GET' && url.pathname === '/__mock/requests') {
    jsonResponse(res, 200, state.requests)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/services') {
    jsonResponse(res, 200, services)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/cultures') {
    jsonResponse(res, 200, cultures)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/confessions') {
    jsonResponse(res, 200, confessions)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/regions') {
    jsonResponse(res, 200, regions)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/login') {
    const body = await readJson(req)
    if (body.email === COUPLE_E2E.email && body.password === COUPLE_E2E.password) {
      jsonResponseWithCookie(
        res,
        200,
        { ok: true },
        `jwt_token=${COUPLE_E2E.token}; Path=/; HttpOnly; SameSite=Lax`,
      )
      return
    }
    jsonResponse(res, 401, { error: 'invalid_credentials' })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/admin/me') {
    jsonResponse(res, 401, { error: 'Unauthorized.' })
    return
  }

  const coupleToken = tokenFromCookie(req)

  if (req.method === 'GET' && url.pathname === '/api/v1/couples/me') {
    if (!isCoupleToken(coupleToken)) {
      jsonResponse(res, 401, { error: 'Unauthorized.' })
      return
    }
    jsonResponse(res, 200, COUPLE_E2E.session)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/couples/me/provider-leads') {
    if (!isCoupleToken(coupleToken)) {
      jsonResponse(res, 401, { error: 'Unauthorized.' })
      return
    }
    jsonResponse(res, 200, { items: [] })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/couples/me/pins') {
    if (!isCoupleToken(coupleToken)) {
      jsonResponse(res, 401, { error: 'Unauthorized.' })
      return
    }
    jsonResponse(res, 200, { items: [] })
    return
  }

  const onboardingMatch = url.pathname.match(/^\/api\/v1\/onboarding\/([^/]+)$/)
  if (req.method === 'GET' && onboardingMatch) {
    const token = onboardingMatch[1]
    if (token === 'expired-token') {
      jsonResponse(res, 410, { error: 'Token expiré' })
      return
    }
    if (token === 'completed-token') {
      jsonResponse(res, 410, { error: 'Onboarding deja finalise' })
      return
    }
    jsonResponse(res, 200, overviewForToken(token))
    return
  }

  const patchMatch = url.pathname.match(/^\/api\/v1\/vendors\/onboarding\/([^/]+)$/)
  if (req.method === 'PATCH' && patchMatch) {
    const token = patchMatch[1]
    const body = await readJson(req)
    state.requests.push({ token, method: req.method, path: url.pathname, body })

    if (body.step === 'credentials' && body.data?.email === 'conflict@example.test') {
      jsonResponse(res, 409, { error: 'Email already used.' })
      return
    }

    const currentStep = nextStepForPatch(token, body)
    if (isSessionToken(token)) {
      const session = sessionForToken(token)
      session.data[body.step] = body.data
      session.currentStep = currentStep
    }

    jsonResponse(res, 200, { current_step: currentStep })
    return
  }

  const portfolioMatch = url.pathname.match(/^\/api\/v1\/vendors\/onboarding\/([^/]+)\/portfolio$/)
  if (req.method === 'POST' && portfolioMatch) {
    const token = portfolioMatch[1]
    await readBody(req)
    const session = sessionForToken(token)
    const uploads = state.portfolioUploads[token] ?? []
    const isCover = uploads.length === 0
    const image = {
      id: `portfolio-${uploads.length + 1}`,
      url: `https://example.test/portfolio-${uploads.length + 1}.jpg`,
      is_cover: isCover,
      sort_order: uploads.length,
    }
    const images = isCover
      ? [{ ...image, is_cover: true }, ...uploads.map(item => ({ ...item, is_cover: false }))]
      : [...uploads, image]
    state.portfolioUploads[token] = images
    session.data.portfolio = { images }
    state.requests.push({
      token,
      method: req.method,
      path: url.pathname,
      body: { step: 'portfolio_upload', data: { image_id: image.id, is_cover: image.is_cover } },
    })
    jsonResponse(res, 200, { images })
    return
  }

  const portfolioDeleteMatch = url.pathname.match(/^\/api\/v1\/vendors\/onboarding\/([^/]+)\/portfolio\/([^/]+)$/)
  if (req.method === 'DELETE' && portfolioDeleteMatch) {
    const [, token, imageId] = portfolioDeleteMatch
    state.portfolioUploads[token] = (state.portfolioUploads[token] ?? []).filter(image => image.id !== imageId)
    const session = sessionForToken(token)
    session.data.portfolio = { images: state.portfolioUploads[token] }
    state.requests.push({
      token,
      method: req.method,
      path: url.pathname,
      body: { step: 'portfolio_delete', data: { image_id: imageId } },
    })
    emptyResponse(res)
    return
  }

  jsonResponse(res, 404, { error: `No mock route for ${req.method} ${url.pathname}` })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock API listening on http://127.0.0.1:${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
