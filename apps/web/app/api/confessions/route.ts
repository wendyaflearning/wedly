export async function GET() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/confessions`,
    { cache: 'no-store' }
  )
  if (!res.ok) return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  return Response.json(await res.json())
}
