import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  if (query.length < 2) return NextResponse.json([])

  try {
    // No featuretype filter — broader search so US cities like "Orlando", "Austin" etc. all appear
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=25&accept-language=en`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Globetrotter-TravelApp/1.0 contact@globetrotter.app' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('Nominatim failed')
    const data = await res.json()

    // Accept cities, towns, villages and named places; exclude raw admin boundaries
    const GOOD_CLASSES = new Set(['place', 'boundary'])
    const GOOD_TYPES  = new Set([
      'city', 'town', 'village', 'hamlet', 'municipality',
      'borough', 'suburb', 'quarter', 'neighbourhood',
    ])

    const seen = new Set<string>()
    const results = data
      .map((item: any) => {
        const type: string  = item.type  || ''
        const cls:  string  = item.class || ''

        // Best city name: prefer structured address fields over raw item.name
        const city =
          item.address?.city         ||
          item.address?.town         ||
          item.address?.village      ||
          item.address?.municipality ||
          item.name

        const country     = item.address?.country      || ''
        const countryCode = (item.address?.country_code || '').toUpperCase()
        const state       = item.address?.state || item.address?.region || ''

        return { city, country, countryCode, state, type, cls,
          rank: item.place_rank || 0,
          lat: parseFloat(item.lat), lon: parseFloat(item.lon),
          placeId: item.place_id, importance: item.importance || 0 }
      })
      .filter((r: any) => {
        if (!r.city || !r.country) return false
        // Major cities come back as boundary/administrative (Tokyo, Paris, NYC all do);
        // place_rank >= 8 keeps city-level boundaries while excluding countries (~4) and large regions
        if (r.cls === 'boundary' && !GOOD_TYPES.has(r.type) && !(r.type === 'administrative' && r.rank >= 8)) return false
        // Deduplicate by city+country
        const key = `${r.city.toLowerCase()}-${r.country.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 7)
      .map((r: any) => ({
        id: `nominatim-${r.placeId}`,
        name: r.city,
        country: r.country,
        countryCode: r.countryCode,
        displayName: r.state && r.state !== r.city && r.state !== r.country
          ? `${r.city}, ${r.state}, ${r.country}`
          : `${r.city}, ${r.country}`,
        lat: r.lat,
        lon: r.lon,
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
