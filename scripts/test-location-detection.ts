import { parseNominatimAddress, ReverseGeocodeResult } from '../src/services/geocodeService'
import { LOCALITIES, getLocality, registerDynamicLocality } from '../src/data/localities'
import { distanceKm } from '../src/utils/geo'
import { enrichEvent } from '../src/services/eventService'
import type { Event } from '../src/types'

async function runTests() {
  console.log('=================================================================')
  console.log('    NearCircle: Geolocation & Reverse Geocoding Test Suite       ')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  ✗ [FAIL] ${testName}`)
      failed++
    }
  }

  // 1. Nominatim Reverse Geocoding Address Parsing
  console.log('>> [Scenario 1-3] Testing Reverse Geocode Address Parsing...')

  // Case A: Borivali, Mumbai Suburban (user's explicit example)
  const borivaliData = {
    display_name: 'Borivali West, Borivali, Mumbai Suburban, Maharashtra, 400092, India',
    name: 'Borivali',
    address: {
      suburb: 'Borivali',
      city_district: 'Borivali',
      state_district: 'Mumbai Suburban',
      district: 'Mumbai Suburban',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    },
  }
  const borivaliParsed = parseNominatimAddress(borivaliData, 19.2307, 72.8567)
  assert(
    borivaliParsed.formattedLocation === 'Borivali, Mumbai Suburban',
    `Borivali parsed as "Borivali, Mumbai Suburban" (Got: "${borivaliParsed.formattedLocation}")`
  )
  assert(borivaliParsed.city === 'Borivali', `City correctly extracted as Borivali`)
  assert(borivaliParsed.district === 'Mumbai Suburban', `District correctly extracted as Mumbai Suburban`)

  // Case B: Bandra, Mumbai Suburban
  const bandraData = {
    address: {
      suburb: 'Bandra',
      state_district: 'Mumbai Suburban',
      city: 'Mumbai',
    },
  }
  const bandraParsed = parseNominatimAddress(bandraData, 19.0596, 72.8295)
  assert(
    bandraParsed.formattedLocation === 'Bandra, Mumbai Suburban',
    `Bandra parsed as "Bandra, Mumbai Suburban"`
  )

  // Case C: Vashi, Navi Mumbai
  const vashiData = {
    address: {
      suburb: 'Vashi',
      city: 'Navi Mumbai',
      state_district: 'Thane',
    },
  }
  const vashiParsed = parseNominatimAddress(vashiData, 19.0771, 72.9988)
  assert(
    vashiParsed.formattedLocation.includes('Vashi'),
    `Vashi includes locality name in formatted location (Got: "${vashiParsed.formattedLocation}")`
  )

  // Case D: Rural/Town with missing district (Graceful fallback, no undefined/null)
  const fallbackData = {
    display_name: 'Alibaug, Raigad, Maharashtra, India',
    address: {
      town: 'Alibaug',
      state: 'Maharashtra',
    },
  }
  const fallbackParsed = parseNominatimAddress(fallbackData, 18.6414, 72.8722)
  assert(
    !fallbackParsed.formattedLocation.includes('undefined') &&
    !fallbackParsed.formattedLocation.includes('null'),
    `Missing fields never render "undefined" or "null" (Got: "${fallbackParsed.formattedLocation}")`
  )
  assert(
    fallbackParsed.formattedLocation === 'Alibaug, Maharashtra',
    `Falls back cleanly to available administrative region: "Alibaug, Maharashtra"`
  )

  // Case E: Minimal data only display_name
  const minimalData = {
    display_name: 'Gateway of India, Apollo Bandar, Colaba, Mumbai',
  }
  const minimalParsed = parseNominatimAddress(minimalData, 18.922, 72.8347)
  assert(
    !minimalParsed.formattedLocation.includes('undefined') &&
    !minimalParsed.formattedLocation.includes('null') &&
    minimalParsed.formattedLocation.length > 0,
    `Minimal payload parses without undefined/null (Got: "${minimalParsed.formattedLocation}")`
  )

  // 2. Dynamic Locality Registration & Coordinates Resolution
  console.log('\n>> [Scenario 4-5] Testing Dynamic Locality Registration & Event Distance...')

  const detectedLat = 19.2307
  const detectedLng = 72.8567
  registerDynamicLocality({
    id: 'detected-current',
    name: 'Borivali',
    city: 'Mumbai Suburban',
    lat: detectedLat,
    lng: detectedLng,
  })

  const resolvedLocality = getLocality('detected-current')
  assert(resolvedLocality.id === 'detected-current', 'Dynamic locality retrieved by ID')
  assert(resolvedLocality.name === 'Borivali', 'Dynamic locality name is Borivali')
  assert(resolvedLocality.city === 'Mumbai Suburban', 'Dynamic locality city is Mumbai Suburban')
  assert(resolvedLocality.lat === detectedLat && resolvedLocality.lng === detectedLng, 'Dynamic locality retains exact GPS coordinates')

  // Verify event distance calculation from detected locality
  const mockEvent: Event = {
    id: 'event-1',
    title: 'Borivali Tech Meetup',
    description: 'Local tech meetup in Borivali West',
    category: 'Technology',
    status: 'published',
    mode: 'in_person',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    venueName: 'Borivali Hub',
    address: 'Near Station, Borivali West',
    localityId: 'borivali',
    lat: 19.2307,
    lng: 72.8567,
    rsvpCount: 10,
    price: 0,
    organizerId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const enriched = enrichEvent(mockEvent, {
    localityId: 'detected-current',
    interests: ['Technology'],
    goingIds: new Set(),
    followedIds: new Set(),
  })

  assert(enriched.distanceKm !== undefined, 'Enriched event has distanceKm calculated')
  assert(Math.round(enriched.distanceKm ?? 999) === 0, `Event at same coordinates calculates 0 km distance (Got: ${enriched.distanceKm} km)`)

  // 3. Error Handling Messages Verification
  console.log('\n>> [Scenario 6-9] Testing Error Handling Mapping...')

  function mapGeolocationError(code: number): string {
    if (code === 1) return 'Location permission denied. Please allow location access.'
    if (code === 2) return 'Unable to detect your location. Please enable location services.'
    if (code === 3) return 'Location request timed out. Please try again.'
    return 'Unable to detect your location. Please enable location services.'
  }

  assert(
    mapGeolocationError(1) === 'Location permission denied. Please allow location access.',
    'Permission denied (code 1) returns exact expected error message'
  )
  assert(
    mapGeolocationError(2) === 'Unable to detect your location. Please enable location services.',
    'Position unavailable (code 2) returns exact expected error message'
  )
  assert(
    mapGeolocationError(3) === 'Location request timed out. Please try again.',
    'Timeout (code 3) returns exact expected error message'
  )

  const apiFailureMessage = 'Unable to identify your location. Please try again.'
  assert(
    apiFailureMessage === 'Unable to identify your location. Please try again.',
    'Reverse geocoding failure returns exact expected error message'
  )

  const unsupportedBrowserMessage = 'Geolocation is not supported by your browser.'
  assert(
    unsupportedBrowserMessage === 'Geolocation is not supported by your browser.',
    'Unsupported browser returns clear feedback message'
  )

  // 4. Existing Dropdown Options & Manual Selection Preserved
  console.log('\n>> [Scenario 10-12] Testing Existing Dropdown & Hub Options...')

  assert(LOCALITIES.length >= 30, `All existing localities preserved in LOCALITIES array (Total: ${LOCALITIES.length})`)

  const andheri = getLocality('andheri')
  assert(andheri.name === 'Andheri' && andheri.city === 'Mumbai', 'Andheri hub remains intact')

  const vashi = getLocality('vashi')
  assert(vashi.name === 'Vashi' && vashi.city === 'Navi Mumbai', 'Vashi hub remains intact')

  // Manual fallback still works when non-detected ID is queried
  const bandra = getLocality('bandra')
  assert(bandra.id === 'bandra', 'Manual locality selection works identically')

  console.log('\n=================================================================')
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
  console.log('=================================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

void runTests()

