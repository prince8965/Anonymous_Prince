import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_LOCALITY_ID, registerDynamicLocality } from '../data/localities'
import { defaultFilters, reverseGeocodeNominatim } from '../services'
import type { Category } from '../types'
import { readStore, writeStore } from '../utils/storage'
import { useToast } from './ToastContext'

export interface DetectedLocation {
  id: string
  name: string
  city: string
  formattedLocation: string // Formatted as "City, District" e.g. "Borivali, Mumbai Suburban"
  lat: number
  lng: number
}

interface AppValue {
  localityId: string
  setLocalityId: (id: string) => void
  detectedLocation: DetectedLocation | null
  interests: Category[]
  toggleInterest: (c: Category) => void
  detectLocation: (silent?: boolean) => Promise<string | null>
  isDetectingLocation: boolean
}

const AppContext = createContext<AppValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(() => {
    const saved = readStore<DetectedLocation | null>('detected_location', null)
    if (saved && saved.id) {
      registerDynamicLocality(saved)
    }
    return saved
  })

  const [localityId, setLocalityState] = useState<string>(() =>
    readStore('locality', DEFAULT_LOCALITY_ID)
  )
  const [interests, setInterests] = useState<Category[]>(() =>
    readStore('interests', defaultFilters.interests)
  )
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  const { notify } = useToast()

  const setLocalityId = useCallback((id: string) => {
    setLocalityState(id)
    writeStore('locality', id)
  }, [])

  const toggleInterest = useCallback((c: Category) => {
    setInterests((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
      writeStore('interests', next)
      return next
    })
  }, [])

  const detectLocation = useCallback(
    async (silent = false): Promise<string | null> => {
      if (!('geolocation' in navigator)) {
        if (!silent) {
          notify('Geolocation is not supported by your browser.', 'error')
        }
        return null
      }

      if (isDetectingLocation) {
        return null
      }

      setIsDetectingLocation(true)

      return new Promise<string | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords

              // Call OpenStreetMap Nominatim reverse geocoding API
              const rev = await reverseGeocodeNominatim(latitude, longitude)

              const detectedId = 'detected-current'
              const detected: DetectedLocation = {
                id: detectedId,
                name: rev.city,
                city: rev.district || rev.city,
                formattedLocation: rev.formattedLocation,
                lat: latitude,
                lng: longitude,
              }

              registerDynamicLocality(detected)
              setDetectedLocation(detected)
              setLocalityState(detectedId)
              writeStore('detected_location', detected)
              writeStore('locality', detectedId)

              if (!silent) {
                notify(`📍 Location detected: ${rev.formattedLocation}`, 'success')
              }
              resolve(detectedId)
            } catch (err) {
              console.warn('Reverse geocoding failed:', err)
              if (!silent) {
                notify('Unable to identify your location. Please try again.', 'error')
              }
              resolve(null)
            } finally {
              setIsDetectingLocation(false)
            }
          },
          (err) => {
            setIsDetectingLocation(false)
            if (!silent) {
              if (err.code === err.PERMISSION_DENIED) {
                notify('Location permission denied. Please allow location access.', 'error')
              } else if (err.code === err.POSITION_UNAVAILABLE) {
                notify('Unable to detect your location. Please enable location services.', 'error')
              } else if (err.code === err.TIMEOUT) {
                notify('Location request timed out. Please try again.', 'error')
              } else {
                notify('Unable to detect your location. Please enable location services.', 'error')
              }
            }
            resolve(null)
          },
          { maximumAge: 60_000, timeout: 10_000, enableHighAccuracy: true }
        )
      })
    },
    [isDetectingLocation, notify]
  )

  const value = useMemo(
    () => ({
      localityId,
      setLocalityId,
      detectedLocation,
      interests,
      toggleInterest,
      detectLocation,
      isDetectingLocation,
    }),
    [localityId, setLocalityId, detectedLocation, interests, toggleInterest, detectLocation, isDetectingLocation]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
