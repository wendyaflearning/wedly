import http from 'node:http'

const port = Number(process.env.MOCK_API_PORT ?? 4010)

const services = [
  { id: 'service-photo', name: 'Photographe', children: [] },
  { id: 'service-dj', name: 'DJ', children: [] },
  {
    id: 'service-traiteur',
    name: 'Traiteur',
    children: [
      { id: 'service-cocktail', name: 'Cocktail', children: [] },
      { id: 'service-diner', name: 'Diner assis', children: [] },
    ],
  },
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

const baseSteps = [
  { stepKey: 'professions', label: 'Professions', order: 1, status: 'current', isFilled: false },
  { stepKey: 'consent', label: 'Consentement', order: 2, status: 'pending', isFilled: false },
  { stepKey: 'experiences', label: 'Experiences', order: 3, status: 'pending', isFilled: false },
  { stepKey: 'zones_pricing', label: 'Zones et tarifs', order: 4, status: 'pending', isFilled: false },
  { stepKey: 'legal_info', label: 'Informations legales', order: 5, status: 'pending', isFilled: false },
  { stepKey: 'credentials', label: 'Connexion', order: 6, status: 'pending', isFilled: false },
]

const cateringSteps = [
  { stepKey: 'professions', label: 'Professions', order: 1, status: 'completed', isFilled: true },
  { stepKey: 'consent', label: 'Consentement', order: 2, status: 'current', isFilled: false },
  { stepKey: 'experiences', label: 'Experiences', order: 3, status: 'pending', isFilled: false },
  { stepKey: 'catering_characteristics', label: 'Caracteristiques traiteur', order: 4, status: 'pending', isFilled: false },
  { stepKey: 'zones_pricing', label: 'Zones et tarifs', order: 5, status: 'pending', isFilled: false },
  { stepKey: 'legal_info', label: 'Informations legales', order: 6, status: 'pending', isFilled: false },
  { stepKey: 'credentials', label: 'Connexion', order: 7, status: 'pending', isFilled: false },
]

const state = {
  requests: [],
  sessions: {},
}

function overviewForToken(token) {
  if (token === 'full-flow-token') {
    return overviewForSession(sessionForToken(token))
  }

  const steps = baseSteps.map(step => ({ ...step }))
  const setStep = (stepKey, patch) => {
    const step = steps.find(item => item.stepKey === stepKey)
    if (step) Object.assign(step, patch)
  }

  if (token === 'consent-token') {
    setStep('professions', { status: 'completed', isFilled: true })
    setStep('consent', { status: 'current', isFilled: false })
    return overview(steps, {
      professions: { services: [{ id: 'service-photo', name: 'Photographe' }] },
    })
  }

  if (token === 'catering-consent-token') {
    return overview(cateringSteps.map(step => ({ ...step })), {
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
    for (const step of steps) {
      step.status = 'completed'
      step.isFilled = true
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

  return overview(steps)
}

function sessionForToken(token) {
  if (!state.sessions[token]) {
    state.sessions[token] = {
      currentStep: 'professions',
      data: {},
    }
  }
  return state.sessions[token]
}

function overviewForSession(session) {
  const steps = baseSteps.map(step => {
    const isFilled = Boolean(session.data[step.stepKey])
    return {
      ...step,
      isFilled,
      status: step.stepKey === session.currentStep ? 'current' : isFilled ? 'completed' : 'pending',
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
    zones_pricing: session.data.zones_pricing,
    legal_info: session.data.legal_info,
    credentials: session.data.credentials
      ? { email: session.data.credentials.email }
      : undefined,
  })
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
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function emptyResponse(res, status = 204) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end()
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function nextStepForPatch(token, body) {
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
    if (token === 'full-flow-token') {
      const session = sessionForToken(token)
      session.data[body.step] = body.data
      session.currentStep = currentStep
    }

    jsonResponse(res, 200, { current_step: currentStep })
    return
  }

  jsonResponse(res, 404, { error: `No mock route for ${req.method} ${url.pathname}` })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock API listening on http://127.0.0.1:${port}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
