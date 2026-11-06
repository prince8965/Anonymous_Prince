import { isWithinMumbaiNaviMumbai, LOCALITIES } from '../data/localities'

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
  matched: boolean
  isWithinBounds: boolean
  error?: string
}

/**
 * Automatically geocodes a venue address, road, or locality in Mumbai / Navi Mumbai
 * using OpenStreetMap Nominatim with strict Mumbai / Navi Mumbai bounding.
 */
export async function geocodeMumbaiAddress(
  address: string,
  localityId?: string
): Promise<GeocodeResult> {
  const query = address.trim()
  if (!query || query.length < 3) {
    return {
      lat: 19.1136,
      lng: 72.8697,
      displayName: '',
      matched: false,
      isWithinBounds: true,
    }
  }

  // Check if user accidentally typed another city outside Mumbai / Navi Mumbai
  const forbiddenCities = ['pune', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad']
  const lower = query.toLowerCase()
  for (const city of forbiddenCities) {
    if (lower.includes(city) && !lower.includes('mumbai')) {
      return {
        lat: 19.1136,
        lng: 72.8697,
        displayName: '',
        matched: false,
        isWithinBounds: false,
        error: `NearCircle is dedicated strictly to Mumbai & Navi Mumbai. "${city.toUpperCase()}" is outside the supported region.`,
      }
    }
  }

  // Resolve locality context if available
  const loc = localityId ? LOCALITIES.find((l) => l.id === localityId) : undefined
  const contextCity = loc?.city ?? 'Mumbai'
  const contextArea = loc?.name ?? ''

  // Build query string ensuring Mumbai/Navi Mumbai focus
  let cleanQuery = query
  if (!cleanQuery.toLowerCase().includes('mumbai') && !cleanQuery.toLowerCase().includes('thane')) {
    cleanQuery = `${cleanQuery}, ${contextArea ? contextArea + ', ' : ''}${contextCity}, Maharashtra, India`
  }

  try {
    // OpenStreetMap Nominatim with Mumbai & Navi Mumbai viewbox (72.70,18.80 to 73.22,19.38)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&viewbox=72.70,19.38,73.22,18.80&bounded=0&limit=1&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`)
    }

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0]
      const lat = parseFloat(item.lat)
      const lng = parseFloat(item.lon)

      const withinBounds = isWithinMumbaiNaviMumbai(lat, lng)

      if (!withinBounds) {
        return {
          lat,
          lng,
          displayName: item.display_name,
          matched: true,
          isWithinBounds: false,
          error: 'Location found, but it appears to be outside Mumbai / Navi Mumbai.',
        }
      }

      return {
        lat,
        lng,
        displayName: item.display_name,
        matched: true,
        isWithinBounds: true,
      }
    }

    // Fallback: If specific venue not found in Nominatim, fallback to the locality centre
    if (loc) {
      return {
        lat: loc.lat,
        lng: loc.lng,
        displayName: `${loc.name}, ${loc.city}`,
        matched: false,
        isWithinBounds: true,
      }
    }

    return {
      lat: 19.1136,
      lng: 72.8697,
      displayName: 'Andheri, Mumbai',
      matched: false,
      isWithinBounds: true,
    }
  } catch (err) {
    console.warn('Geocoding service warning:', err)
    // Graceful fallback to locality coordinates
    return {
      lat: loc?.lat ?? 19.1136,
      lng: loc?.lng ?? 72.8697,
      displayName: loc ? `${loc.name}, ${loc.city}` : 'Andheri, Mumbai',
      matched: false,
      isWithinBounds: true,
    }
  }
}

export interface ReverseGeocodeResult {
  latitude: number
  longitude: number
  city: string
  district: string
  formattedLocation: string // Formatted as "City, District" e.g. "Borivali, Mumbai Suburban"
  rawAddress?: Record<string, string>
}

// In-memory cache to prevent repeated requests and respect Nominatim usage policy
const reverseCache = new Map<string, { result: ReverseGeocodeResult; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function parseNominatimAddress(
  data: any,
  lat: number,
  lon: number
): ReverseGeocodeResult {
  const addr = data?.address || {}

  // Prefer city, town, or village for the city name (or suburb/locality in metropolitan hubs)
  const city =
    addr.suburb ||
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.hamlet ||
    data?.name ||
    ''

  // Extract district when available
  const district =
    addr.district ||
    addr.state_district ||
    addr.county ||
    (addr.city && addr.city.toLowerCase() !== city.toLowerCase() ? addr.city : '') ||
    addr.city_district ||
    addr.state ||
    ''

  let formattedLocation = ''
  if (city && district) {
    formattedLocation = `${city}, ${district}`
  } else if (city) {
    formattedLocation = city
  } else if (district) {
    formattedLocation = district
  } else if (data?.display_name) {
    const parts = String(data.display_name)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    formattedLocation = parts.slice(0, 2).join(', ')
  } else {
    formattedLocation = 'Current Location'
  }

  return {
    latitude: lat,
    longitude: lon,
    city: city || formattedLocation,
    district: district || '',
    formattedLocation,
    rawAddress: addr,
  }
}

/**
 * Reverse geocodes coordinates into "City, District" using OpenStreetMap Nominatim.
 * Endpoint: https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=LATITUDE&lon=LONGITUDE
 */
export async function reverseGeocodeNominatim(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
  const cached = reverseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result
  }

  const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Reverse geocoding HTTP error: ${response.status}`)
  }

  const data = await response.json()
  if (!data || data.error) {
    throw new Error(data?.error || 'Unable to identify location from coordinates.')
  }

  const result = parseNominatimAddress(data, lat, lon)
  reverseCache.set(cacheKey, { result, timestamp: Date.now() })
  return result
}
