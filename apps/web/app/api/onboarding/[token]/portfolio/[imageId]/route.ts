export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string; imageId: string }> }
) {
  const { token, imageId } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/onboarding/${token}/portfolio/${imageId}`,
    { method: 'DELETE' }
  )

  if (res.status === 204) {
    return new Response(null, { status: 204 })
  }

  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ error: 'Erreur serveur inattendue.' }, { status: 500 })
  }
}
