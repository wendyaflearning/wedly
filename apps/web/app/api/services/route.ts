export async function GET() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/services`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  const data = await res.json()
  return Response.json(data)
}