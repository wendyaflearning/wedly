export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const contentType = request.headers.get('content-type') ?? ''
  const body = await request.arrayBuffer()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/onboarding/${token}/portfolio`,
    {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    }
  )

  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return Response.json(data, { status: res.status })
  } catch {
    console.error('[portfolio] réponse Symfony non-JSON :', text.slice(0, 500))
    return Response.json({ error: 'Erreur serveur inattendue.' }, { status: 500 })
  }
}
