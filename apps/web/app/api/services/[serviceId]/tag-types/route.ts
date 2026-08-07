export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/services/${serviceId}/tag-types`,
    { cache: 'no-store' }
  )

  const data = await res.json().catch(() => ({}))
  return Response.json(data, { status: res.status })
}
