'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { TRANSPORT_OPTIONS } from '@/lib/data/transport'
import { HOTELS } from '@/lib/data/hotels'
import { ACTIVITIES } from '@/lib/data/activities'
import { formatCurrency, formatDate, getDaysBetween, getRandomTripImage } from '@/lib/utils'
import {
  Plane, Building2, MapPin, Star, ArrowLeft,
  ArrowRight, CheckCircle, TrendingUp, Camera,
  Utensils, ChevronRight, AlertCircle, Sparkles, CreditCard
} from 'lucide-react'
import type { Trip, Destination, TransportOption, Hotel } from '@/types'


export default function TripBreakdownPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [destination, setDestination] = useState<Destination | null>(null)
  const [transport, setTransport] = useState<TransportOption | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: tripData } = await supabase
          .from('trips').select('*').eq('id', id).single()

        if (!tripData) { setLoading(false); return }
        setTrip(tripData)

        // Support both static destination IDs and Nominatim-searched trips
        let dest = DESTINATIONS.find(d => d.id === tripData.destination_id) || null
        if (!dest && tripData.destination_name) {
          dest = {
            id: 'custom',
            name: tripData.destination_name,
            country: tripData.destination_country || '',
            city: tripData.destination_name,
            description: '',
            image_url: tripData.image_url || getRandomTripImage(tripData.id),
            highlights: [], best_months: [], avg_temp: '', currency: '', language: '', timezone: '',
          } as any
        }
        setDestination(dest)

        const trans = TRANSPORT_OPTIONS.find(tr => tr.id === tripData.transport_option_id) || null
        setTransport(trans)

        const h = HOTELS.find(h => h.id === tripData.hotel_id) || null
        setHotel(h)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Trip not found.</p>
          <Link href="/home" className="text-blue-600 font-semibold hover:underline">← Back to Home</Link>
        </div>
      </div>
    )
  }

  const destName = destination?.name || (trip as any).destination_name || 'Your Destination'
  const days = getDaysBetween(trip.start_date || '', trip.end_date || '')
  const flightPrice = transport?.price || 0
  const hotelTotal = (hotel?.price_per_night || 0) * days
  const activities = destination ? ACTIVITIES.filter(a => a.destination_id === destination.id).slice(0, 3) : []
  const activityTotal = activities.reduce((s, a) => s + a.price, 0)
  // For real-search trips that have total_cost stored, use that as the baseline
  const totalCost = trip.total_cost || (flightPrice + hotelTotal + activityTotal)
  const budgetRemaining = (trip.budget ?? 0) - totalCost
  const budgetPct = Math.min(Math.round((totalCost / (trip.budget ?? totalCost ?? 1)) * 100), 100)

  const BREAKDOWN = [
    { label: 'Flight', amount: flightPrice, color: 'bg-blue-500', textColor: 'text-blue-600', icon: Plane,
      pct: Math.round((flightPrice / totalCost) * 100), detail: `${transport?.operator || ''} · ${transport?.duration || ''}` },
    { label: 'Hotel', amount: hotelTotal, color: 'bg-purple-500', textColor: 'text-purple-600', icon: Building2,
      pct: Math.round((hotelTotal / totalCost) * 100), detail: `${hotel?.name || ''} · ${days} nights` },
    { label: 'Activities', amount: activityTotal, color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: Camera,
      pct: Math.round((activityTotal / totalCost) * 100), detail: `${activities.length} planned activities` },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{trip.title}</h1>
              <p className="text-xs text-slate-500">
                {formatDate(trip.start_date)} – {formatDate(trip.end_date)} · {days} days · {trip.num_travelers} traveler{trip.num_travelers !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-slate-500">total estimate</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Visual cost breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Cost Breakdown</h2>

              {/* Stacked bar */}
              <div className="flex h-7 rounded-full overflow-hidden mb-4 gap-0.5">
                {BREAKDOWN.map(item => (
                  <div key={item.label} className={`${item.color} transition-all duration-700 flex items-center justify-center`}
                    style={{ width: `${item.pct}%` }} title={`${item.label}: ${item.pct}%`}>
                    {item.pct > 15 && <span className="text-white text-xs font-bold">{item.pct}%</span>}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                {BREAKDOWN.map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-slate-600">{item.label} <span className="font-bold text-slate-900">{item.pct}%</span></span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {BREAKDOWN.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color} bg-opacity-10`}>
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                          <span className={`text-lg font-bold ${item.textColor}`}>{formatCurrency(item.amount)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1.5">{item.detail}</p>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                            style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Total estimate</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Budget remaining</p>
                  <p className={`text-3xl font-bold ${budgetRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(budgetRemaining))}
                    <span className="text-sm font-normal text-slate-500 ml-1">{budgetRemaining >= 0 ? 'under' : 'over'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Budget health */}
            <div className={`rounded-2xl p-5 border ${
              budgetPct < 80 ? 'bg-emerald-50 border-emerald-200' :
              budgetPct < 100 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {budgetPct < 80
                  ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                  : budgetPct < 100
                  ? <AlertCircle className="w-5 h-5 text-amber-600" />
                  : <AlertCircle className="w-5 h-5 text-red-600" />}
                <h3 className={`font-bold text-sm ${
                  budgetPct < 80 ? 'text-emerald-900' : budgetPct < 100 ? 'text-amber-900' : 'text-red-900'
                }`}>
                  {budgetPct < 80 ? 'Budget Healthy' : budgetPct < 100 ? 'Approaching Budget' : 'Over Budget'}
                </h3>
              </div>
              <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  budgetPct < 80 ? 'bg-emerald-500' : budgetPct < 100 ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
              </div>
              <p className={`text-xs ${
                budgetPct < 80 ? 'text-emerald-700' : budgetPct < 100 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {formatCurrency(totalCost)} spent of {formatCurrency(trip.budget ?? 0)} budget ({budgetPct}%)
              </p>
            </div>

            {/* Flight details */}
            {transport && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="font-bold text-slate-900">Flights Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Outbound', from: trip.from_city, to: destination?.city || destName },
                    { label: 'Return', from: destination?.city || destName, to: trip.from_city },
                  ].map((leg, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">{leg.label}</p>
                          <p className="font-bold text-slate-900">{leg.from} → {leg.to}</p>
                          <p className="text-xs text-slate-500">{transport.operator} · {transport.duration}</p>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(flightPrice)}</span>
                      </div>
                      {i === 0 && (
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            Departs {transport.departure_time} · Arrives {transport.arrival_time}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Total flights (round trip)</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(flightPrice * 2)}</span>
                </div>
              </div>
            )}

            {/* Hotel details */}
            {hotel && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="relative h-48">
                  <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 bg-yellow-400 text-slate-900 px-2.5 py-1 rounded-full shadow-md">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{hotel.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{hotel.name}</h3>
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />{hotel.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(hotel.price_per_night)}</p>
                      <p className="text-xs text-slate-500">/ night</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities?.slice(0, 5).map((a: string) => (
                      <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{days} nights × {formatCurrency(hotel.price_per_night)}</span>
                    <span className="text-xl font-bold text-purple-600">{formatCurrency(hotelTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 text-emerald-600" />
                  </div>
                  Activities Breakdown
                </h2>
                <div className="space-y-3">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={act.image_url} alt={act.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{act.name}</p>
                        <p className="text-xs text-slate-400">{act.duration}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(act.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Activities total</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(activityTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Estimate</p>
              <p className="text-4xl font-bold mb-1">{formatCurrency(totalCost)}</p>
              <p className="text-blue-200 text-xs">for {trip.num_travelers} traveler · {days} days</p>
              <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                {BREAKDOWN.map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-blue-200">{item.label}</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />Budget vs Spend
              </h3>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Spent</span>
                  <span className={`font-bold ${budgetPct < 100 ? 'text-emerald-600' : 'text-red-600'}`}>{budgetPct}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    budgetPct < 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    budgetPct < 100 ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>$0</span>
                <span>{formatCurrency(trip.budget ?? 0)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Complete Booking</span>
              </div>
              <p className="text-blue-200 text-xs mb-3">
                Total: <span className="text-white font-bold">${totalCost.toLocaleString()}</span> for {trip.num_travelers} traveler{trip.num_travelers !== 1 ? 's' : ''}
              </p>
              <a
                href={`/payment?amount=${totalCost}&trip=${encodeURIComponent(trip.title)}&from=${encodeURIComponent((trip as any).from_city || '')}&to=${encodeURIComponent(destName)}&mode=flight&travelers=${trip.num_travelers}&tripId=${trip.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-sm transition-colors">
                <CreditCard className="w-4 h-4" /> Pay Now
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />Saving Tips
              </h3>
              <div className="space-y-2.5">
                {[
                  'Book flights 3+ weeks early for up to 25% savings',
                  'Look for combo hotel + flight deals',
                  'Free walking tours cover major sights',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                    <span className="text-blue-500 font-bold text-sm">•</span>
                    <p className="text-xs text-slate-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
