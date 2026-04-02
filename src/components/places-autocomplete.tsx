'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ExternalLink, MapPin, Loader2 } from 'lucide-react'

interface PlaceResult {
  name: string
  placeId: string
  lat: number
  lng: number
  address: string
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: PlaceResult) => void
  onClear: () => void
  placeSelected: boolean
  selectedAddress?: string
  selectedPlaceId?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  if (!API_KEY || input.length < 2) return []

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({ input }),
  })

  if (!res.ok) return []
  const data = await res.json()

  return (data.suggestions ?? [])
    .filter((s: Record<string, unknown>) => s.placePrediction)
    .map((s: { placePrediction: { placeId: string; structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } } } }) => ({
      placeId: s.placePrediction.placeId,
      mainText: s.placePrediction.structuredFormat.mainText.text,
      secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? '',
    }))
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  if (!API_KEY) return null

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'displayName,formattedAddress,location',
    },
  })

  if (!res.ok) return null
  const data = await res.json()

  return {
    name: data.displayName?.text ?? '',
    placeId,
    lat: data.location?.latitude ?? 0,
    lng: data.location?.longitude ?? 0,
    address: data.formattedAddress ?? '',
  }
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/40'
const inputSty = { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' } as const

export default function PlacesAutocomplete({
  value, onChange, onPlaceSelect, onClear, placeSelected, selectedAddress, selectedPlaceId
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (input.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(input)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
      setLoading(false)
    }, 300)
  }, [])

  function handleInputChange(val: string) {
    onChange(val)
    debouncedSearch(val)
  }

  async function handleSelect(suggestion: Suggestion) {
    setShowDropdown(false)
    setSuggestions([])
    setLoading(true)

    const details = await fetchPlaceDetails(suggestion.placeId)
    setLoading(false)

    if (details) {
      onChange(details.name)
      onPlaceSelect(details)
    } else {
      onChange(suggestion.mainText)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!API_KEY) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter venue name"
        className={inputCls}
        style={inputSty}
      />
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      {!placeSelected ? (
        <>
          <div className="relative">
            <input
              value={value}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
              placeholder="Search for a venue..."
              className={inputCls}
              style={inputSty}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--muted)' }} />
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              {suggestions.map(s => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: 'var(--fg)' }}
                >
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF6B4A' }} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.mainText}</div>
                    {s.secondaryText && (
                      <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{s.secondaryText}</div>
                    )}
                  </div>
                </button>
              ))}
              <div className="px-3.5 py-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[9px]" style={{ color: 'var(--muted)' }}>Powered by Google</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B4A' }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{value}</div>
            {selectedAddress && selectedAddress !== value && (
              <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{selectedAddress}</div>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(selectedPlaceId || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 hover:opacity-70"
            style={{ color: '#00BFA5' }}
            title="Open in Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => { onClear(); setSuggestions([]) }}
            className="flex-shrink-0 hover:opacity-70 cursor-pointer"
            style={{ color: 'var(--muted)' }}
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
