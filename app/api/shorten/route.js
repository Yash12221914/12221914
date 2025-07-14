
export async function POST(req) {
  const { longUrl, shortcode, validity } = await req.json();

  const generatedCode = shortcode || Math.random().toString(36).substring(2, 8);
  const expiresAt = new Date(Date.now() + ((validity || 30) * 60 * 1000));

  return new Response(
    JSON.stringify({
      shortcode: generatedCode,
      expiresAt: expiresAt.toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
}
