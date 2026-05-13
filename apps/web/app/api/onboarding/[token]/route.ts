export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const body = await request.json()
  const { token } = await params 
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/onboarding/${token}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  return Response.json(data, { status: res.status })
}