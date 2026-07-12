'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, MapPin, Calendar, Users, Clock, Plane,
  Building2, Star, Camera, Utensils, Bike, Sunset,
  ChevronDown, ChevronUp, CheckCircle, Sparkles,
  ThumbsUp, Share2, Download, PartyPopper, CreditCard
} from 'lucide-react'

// Local events data keyed by destination name (lowercase)
const GROUP_LOCAL_EVENTS: Record<string, Array<{emoji: string; name: string; date: string; price: string; category: string; venue: string}>> = {
  bali:      [{emoji:'🔥',name:'Kecak Fire Dance',date:'Daily at sunset',price:'$12',category:'festival',venue:'Uluwatu Temple'},{emoji:'🌕',name:'Full Moon Beach Party',date:'Monthly full moon',price:'$20',category:'nightlife',venue:'Double-Six Beach'},{emoji:'🥭',name:'Organic Bali Market',date:'Saturdays',price:'Free',category:'food',venue:'Ubud'},{emoji:'📚',name:'Ubud Writers Fest',date:'Oct annually',price:'Varies',category:'art',venue:'Ubud Palace'}],
  tokyo:     [{emoji:'🎷',name:'Shinjuku Jazz Night',date:'Fri & Sat',price:'$15',category:'music',venue:'Shinjuku Pit Inn'},{emoji:'🍣',name:'Tsukiji Market Tour',date:'Daily 5am',price:'Free',category:'food',venue:'Tsukiji'},{emoji:'👘',name:'Harajuku Fashion Show',date:'Sundays',price:'Free',category:'art',venue:'Takeshita St'},{emoji:'🎮',name:'Akihabara Gaming Fest',date:'Monthly',price:'$10',category:'festival',venue:'Akihabara'}],
  paris:     [{emoji:'🎨',name:'Musee dOrsay Nights',date:'Thursdays',price:'$18',category:'art',venue:'Musee dOrsay'},{emoji:'🍷',name:'Marais Food Festival',date:'Weekends',price:'Free',category:'food',venue:'Le Marais'},{emoji:'🎺',name:'Latin Quarter Jazz',date:'Fri & Sat',price:'$12',category:'music',venue:'Saint-Michel'},{emoji:'✨',name:'Bastille Night Market',date:'Thursday evenings',price:'Free',category:'nightlife',venue:'Place de la Bastille'}],
  bangkok:   [{emoji:'🥊',name:'Muay Thai at Lumpinee',date:'Tue/Fri/Sat',price:'$30',category:'sports',venue:'Lumpinee Stadium'},{emoji:'🛍️',name:'Chatuchak Market',date:'Sat & Sun',price:'Free',category:'food',venue:'Chatuchak'},{emoji:'🌙',name:'Asiatique Night Bazaar',date:'Daily 5pm–midnight',price:'Free entry',category:'nightlife',venue:'Chao Phraya Riverside'}],
  rome:      [{emoji:'🎼',name:'Opera under the Stars',date:'Summer evenings',price:'$35',category:'music',venue:'Terme di Caracalla'},{emoji:'🍕',name:'Testaccio Food Tour',date:'Daily',price:'$25 guided',category:'food',venue:'Testaccio Market'},{emoji:'🍸',name:'Aperitivo at Campo',date:'Daily 5–8pm',price:'Free',category:'nightlife',venue:'Campo de Fiori'},{emoji:'🏛️',name:'Vatican Night Tour',date:'Friday evenings',price:'$40',category:'art',venue:'Vatican City'}],
  barcelona: [{emoji:'🎧',name:'Sonar Music Festival',date:'June annually',price:'$80/day',category:'festival',venue:'Various venues'},{emoji:'💃',name:'Flamenco Show',date:'Nightly',price:'$40',category:'art',venue:'El Tablao de Carmen'},{emoji:'🥘',name:'La Boqueria Tour',date:'Daily (closed Sun)',price:'Free',category:'food',venue:'La Rambla'},{emoji:'⚽',name:'Beach Football',date:'Evenings',price:'Free',category:'sports',venue:'Barceloneta Beach'}],
  dubai:     [{emoji:'🌆',name:'Burj Khalifa Light Show',date:'Daily 8pm & 10pm',price:'Free',category:'art',venue:'Downtown Dubai'},{emoji:'🛍️',name:'Dubai Shopping Fest',date:'Jan–Feb',price:'Free',category:'festival',venue:'City-wide'},{emoji:'🌶️',name:'Spice Souk Walk',date:'Daily (evenings)',price:'Free',category:'food',venue:'Deira Spice Souk'},{emoji:'🎵',name:'Dubai Jazz Festival',date:'Feb/March',price:'$30+',category:'music',venue:'Dubai Media City'}],
  sydney:    [{emoji:'💡',name:'Vivid Sydney',date:'May–June',price:'Free',category:'festival',venue:'Circular Quay'},{emoji:'🎻',name:'Opera House Concert',date:'Nightly',price:'$50+',category:'music',venue:'Sydney Opera House'},{emoji:'🌿',name:'Bondi Farmers Market',date:'Saturdays',price:'Free',category:'food',venue:'Bondi Beach'},{emoji:'🦁',name:'Taronga Night Lights',date:'Dec–Jan',price:'$45',category:'art',venue:'Taronga Zoo'}],
  chicago:   [{emoji:'🎷',name:'Chicago Jazz Fest',date:'Sept',price:'Free',category:'music',venue:'Millennium Park'},{emoji:'🌭',name:'Chicago Food Fest',date:'Summer',price:'Free entry',category:'food',venue:'Grant Park'},{emoji:'🎨',name:'Art Institute Night',date:'Thursdays',price:'$25',category:'art',venue:'Art Institute'}],
}

const CAT_COLORS: Record<string, string> = {
  festival: 'bg-pink-50 text-pink-700',
  music:    'bg-purple-50 text-purple-700',
  food:     'bg-orange-50 text-orange-700',
  sports:   'bg-emerald-50 text-emerald-700',
  art:      'bg-blue-50 text-blue-700',
  nightlife:'bg-indigo-50 text-indigo-700',
}

function getGroupEvents(destName: string) {
  const lower = destName.toLowerCase()
  for (const [key, evts] of Object.entries(GROUP_LOCAL_EVENTS)) {
    if (lower.includes(key)) return evts
  }
  return [
    {emoji:'🎉',name:'Local Festival',date:'Monthly',price:'Varies',category:'festival',venue:'City Center'},
    {emoji:'🍽️',name:'Food & Night Market',date:'Weekends',price:'Free entry',category:'food',venue:'Main Square'},
    {emoji:'🎶',name:'Live Music Night',date:'Fri & Sat',price:'$10–20',category:'music',venue:'Local Venue'},
    {emoji:'🗺️',name:'Free City Walking Tour',date:'Daily 10am',price:'Free',category:'art',venue:'Town Hall'},
  ]
}

// Destination-aware itinerary templates
const ITINERARY_TEMPLATES: Record<string, Array<{day: number; title: string; events: Array<{time: string; label: string; note: string}>}>> = {
  'dest-bali': [
    { day: 1, title: 'Arrival & Seminyak', events: [
      { time: '14:00', label: 'Land at Ngurah Rai Airport', note: 'Collect luggage, exchange currency' },
      { time: '15:30', label: 'Check in to hotel', note: 'Pool access from arrival' },
      { time: '18:00', label: 'Sunset at Seminyak Beach', note: 'Golden hour photography' },
      { time: '20:00', label: 'Dinner at Ku De Ta', note: 'Beachfront dining, ~$30/person' },
    ]},
    { day: 2, title: 'Ubud & Rice Terraces', events: [
      { time: '07:00', label: 'Sunrise at Tegallalang Rice Terraces', note: 'Best light before 9am' },
      { time: '10:00', label: 'Monkey Forest Sanctuary', note: 'Entry ~$5/person' },
      { time: '14:00', label: 'Ubud Art Market & Palace', note: 'Souvenir shopping' },
      { time: '19:00', label: 'Kecak Fire Dance at Uluwatu', note: 'Book tickets in advance' },
    ]},
    { day: 3, title: 'Surf & Island Life', events: [
      { time: '07:30', label: 'Morning surf lesson at Kuta', note: '2hr beginner session, ~$25' },
      { time: '11:00', label: 'Brunch at Sisterfields Cafe', note: 'Aussie-Balinese fusion' },
      { time: '14:00', label: 'Tanah Lot Temple', note: 'Iconic sea temple on a rock' },
      { time: '20:00', label: 'Night at La Favela', note: 'Cocktails & dancing' },
    ]},
    { day: 4, title: 'Wellness & Departure', events: [
      { time: '08:00', label: 'Tirta Empul Holy Spring', note: 'Purification ritual' },
      { time: '11:00', label: 'Tegenungan Waterfall', note: 'Swim in natural pool' },
      { time: '18:00', label: 'Farewell dinner at Mozaic', note: 'Fine dining, book ahead' },
    ]},
  ],
  'dest-tokyo': [
    { day: 1, title: 'Arrival & Shibuya', events: [
      { time: '14:00', label: 'Land at Narita Airport', note: 'Take Narita Express to city' },
      { time: '16:00', label: 'Check in to hotel', note: 'Store luggage, freshen up' },
      { time: '18:00', label: 'Shibuya Crossing at dusk', note: 'Worlds busiest intersection' },
      { time: '20:00', label: 'Dinner at Ichiran Ramen', note: 'Solo booth ramen experience' },
    ]},
    { day: 2, title: 'Traditional Tokyo', events: [
      { time: '07:00', label: 'Sensoji Temple at sunrise', note: 'Arrive before crowds' },
      { time: '10:00', label: 'Asakusa neighborhood walk', note: 'Street food & shopping' },
      { time: '14:00', label: 'TeamLab Planets', note: 'Digital art museum, book ahead' },
      { time: '19:00', label: 'Omoide Yokocho alley bars', note: 'Yakitori & sake' },
    ]},
    { day: 3, title: 'Harajuku & Culture', events: [
      { time: '09:00', label: 'Meiji Shrine', note: 'Serene forested sanctuary' },
      { time: '11:00', label: 'Harajuku Takeshita Street', note: 'Fashion & crepes' },
      { time: '14:00', label: 'Yoyogi Park picnic', note: 'Grab bento from convenience store' },
      { time: '18:00', label: 'Shinjuku night out', note: 'Golden Gai or Kabukicho' },
    ]},
    { day: 4, title: 'Day Trip & Departure', events: [
      { time: '08:00', label: 'Day trip to Nikko or Kamakura', note: '1h by bullet train' },
      { time: '16:00', label: 'Return to Tokyo', note: 'Final shopping in Akihabara' },
      { time: '19:00', label: 'Farewell dinner', note: 'Omakase sushi experience' },
    ]},
  ],
  'dest-paris': [
    { day: 1, title: 'Arrival & Montmartre', events: [
      { time: '13:00', label: 'Land at CDG Airport', note: 'RER B train to city center' },
      { time: '15:00', label: 'Check in & freshen up', note: 'Drop luggage' },
      { time: '17:00', label: 'Sacré-Cœur Basilica', note: 'Panoramic city views' },
      { time: '20:00', label: 'Dinner in Montmartre', note: 'Classic French bistro' },
    ]},
    { day: 2, title: 'Icons of Paris', events: [
      { time: '08:00', label: 'Eiffel Tower at opening', note: 'Shortest queues early morning' },
      { time: '11:00', label: 'Champs-Élysées stroll', note: 'Window shopping' },
      { time: '14:00', label: 'Louvre Museum highlights', note: 'Mona Lisa, Venus de Milo' },
      { time: '19:00', label: 'Seine River Cruise', note: 'Golden hour on the water' },
    ]},
    { day: 3, title: 'Day Trip & Culture', events: [
      { time: '09:00', label: 'Palace of Versailles', note: 'RER C from city, book tickets' },
      { time: '15:00', label: 'Return to Paris', note: 'Afternoon in Le Marais' },
      { time: '19:00', label: 'Farewell dinner', note: 'Fine dining near the Eiffel Tower' },
    ]},
  ],
  'dest-sydney': [
    { day: 1, title: 'Arrival & Circular Quay', events: [
      { time: '12:00', label: 'Land at Sydney Airport', note: 'Train to city center' },
      { time: '14:00', label: 'Check in & unpack', note: 'Store luggage' },
      { time: '16:00', label: 'Opera House & Harbour Bridge', note: 'Iconic first views' },
      { time: '19:00', label: 'Dinner at The Rocks', note: 'Historic waterfront precinct' },
    ]},
    { day: 2, title: 'Beaches & Bondi', events: [
      { time: '09:00', label: 'Bondi Beach morning swim', note: 'Arrive early for parking' },
      { time: '11:00', label: 'Bondi to Coogee coastal walk', note: 'Stunning 6km clifftop track' },
      { time: '15:00', label: 'Manly Ferry ride', note: 'Best views of the harbour' },
      { time: '19:00', label: 'Darling Harbour dinner', note: 'Waterfront restaurants' },
    ]},
    { day: 3, title: 'Nature & Farewell', events: [
      { time: '09:00', label: 'Blue Mountains day trip', note: '2hr train from Central Station' },
      { time: '16:00', label: 'Return & Taronga Zoo', note: 'Ferry from Circular Quay' },
      { time: '19:00', label: 'Farewell dinner', note: 'Seafood at Sydney Fish Market' },
    ]},
  ],
}

// Generic template for any destination
function getGenericItinerary(destName: string) {
  return [
    { day: 1, title: `Arrival in ${destName}`, events: [
      { time: '14:00', label: `Arrive in ${destName}`, note: 'Check in and settle in' },
      { time: '17:00', label: 'Explore the neighborhood', note: 'Get your bearings' },
      { time: '20:00', label: 'Welcome dinner', note: 'Try local cuisine' },
    ]},
    { day: 2, title: 'City Highlights', events: [
      { time: '09:00', label: 'Top landmarks & museums', note: 'Book tickets in advance' },
      { time: '12:00', label: 'Local market lunch', note: 'Taste authentic street food' },
      { time: '15:00', label: 'Afternoon exploration', note: 'Walking tour of historic center' },
      { time: '19:00', label: 'Group dinner', note: 'Reserve a table for the full group' },
    ]},
    { day: 3, title: 'Adventures & Culture', events: [
      { time: '09:00', label: 'Day excursion or tour', note: 'Book through your hotel concierge' },
      { time: '14:00', label: 'Shopping & souvenirs', note: 'Local artisan markets' },
      { time: '18:00', label: 'Sunset viewpoint', note: 'Capture the golden hour' },
      { time: '20:00', label: 'Evening entertainment', note: 'Local bars or live music' },
    ]},
    { day: 4, title: 'Leisure & Departure', events: [
      { time: '09:00', label: 'Leisure morning', note: 'Breakfast & final walks' },
      { time: '11:00', label: 'Last-minute shopping', note: 'Pick up gifts & souvenirs' },
      { time: '14:00', label: 'Transfer to airport', note: 'Allow extra time for traffic' },
    ]},
  ]
}

const DAY_COLORS = [
  { color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500', icon: Plane },
  { color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500', icon: Camera },
  { color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500', icon: Bike },
  { color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500', icon: Sunset },
  { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Plane },
]

const HOTEL = { name: 'Boutique Hotel', location: '', rating: 4.8, nights: 4, pricePerNight: 150, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&w=800&q=80' }

export default function GroupItineraryPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<number | null>(1)
  const [activeTab, setActiveTab] = useState<'itinerary' | 'costs' | 'flights' | 'events'>('itinerary')
  const [groupName, setGroupName] = useState('Group Trip')
  const [leadingDest, setLeadingDest] = useState(DESTINATIONS[3])
  const [memberCount, setMemberCount] = useState(0)
  const [startDate, setStartDate] = useState(''  )
  const [endDate, setEndDate] = useState('')
  const [budgetPerPerson, setBudgetPerPerson] = useState(0)
  const [addedGroupEvents, setAddedGroupEvents] = useState<Set<number>>(new Set())
  const [groupEventToast, setGroupEventToast] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: grp } = await supabase.from('group_trips').select('*').eq('id', id).single()
      if (grp) {
        setGroupName(grp.name)
        setStartDate(grp.start_date || '')
        setEndDate(grp.end_date || '')
        setBudgetPerPerson(grp.budget_per_person || 0)

        let destIds: string[] = []
        try {
          const parsed = JSON.parse(grp.winning_destination_id || '[]')
          if (Array.isArray(parsed)) destIds = parsed
        } catch { /* ignore */ }

        const { data: votes } = await supabase
          .from('destination_votes').select('destination_id').eq('group_trip_id', id)

        if (votes && votes.length > 0) {
          const tally: Record<string, number> = {}
          votes.forEach((v: any) => { tally[v.destination_id] = (tally[v.destination_id] || 0) + 1 })
          const topId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]
          const found = DESTINATIONS.find(d => d.id === topId)
          if (found) setLeadingDest(found)
        } else if (destIds.length > 0) {
          const found = DESTINATIONS.find(d => d.id === destIds[0])
          if (found) setLeadingDest(found)
        }

        const { count } = await supabase
          .from('group_members').select('id', { count: 'exact', head: true }).eq('group_trip_id', id)
        setMemberCount(count || 0)
      }
      setLoading(false)
    }
    init()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const itineraryDays = ITINERARY_TEMPLATES[leadingDest.id] || getGenericItinerary(leadingDest.name)
  const flightEst = budgetPerPerson ? Math.round(budgetPerPerson * 0.35) : 420
  const hotelEst = budgetPerPerson ? Math.round(budgetPerPerson * 0.40) : 600
  const activityEst = budgetPerPerson ? Math.round(budgetPerPerson * 0.15) : 200
  const foodEst = budgetPerPerson ? Math.round(budgetPerPerson * 0.10) : 150
  const totalCost = flightEst + hotelEst + activityEst + foodEst

  const dateLabel = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${itineraryDays.length} Days · ${itineraryDays.length - 1} Nights`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src={leadingDest.image_url} alt={leadingDest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href={`/group/${id}`}
            className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="p-2.5 bg-black/30 backdrop-blur-sm text-white rounded-xl hover:bg-black/50 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />AI-Generated
              </span>
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />Group's Top Choice
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-1">{leadingDest.name} Itinerary</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{leadingDest.name}, {leadingDest.country}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{dateLabel}</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{memberCount > 0 ? memberCount : 1} Travelers</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />4.9 Destination Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          {(['itinerary', 'costs', 'flights', 'events'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-sm font-bold capitalize border-b-2 transition-all ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}>
              {tab === 'itinerary' ? 'Day-by-Day' : tab === 'costs' ? 'Cost Breakdown' : tab === 'flights' ? 'Flights & Hotel' : 'Local Events'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {activeTab === 'itinerary' && (
              <div className="space-y-3">
                {itineraryDays.map((day, idx) => {
                  const { color, dot, icon: Icon } = DAY_COLORS[idx % DAY_COLORS.length]
                  const isOpen = expandedDay === day.day
                  return (
                    <div key={day.day} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${isOpen ? 'border-blue-200' : 'border-slate-100'}`}>
                      <button onClick={() => setExpandedDay(isOpen ? null : day.day)}
                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors">
                        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day {day.day}</span>
                            {idx === 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Arrival</span>}
                            {idx === itineraryDays.length - 1 && idx > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Departure</span>}
                          </div>
                          <p className="font-bold text-slate-900 text-base">{day.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{day.events.length} activities planned</p>
                        </div>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-slate-100">
                          <div className="relative mt-4 pl-6">
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
                            <div className="space-y-5">
                              {day.events.map((ev, i) => (
                                <div key={i} className="relative">
                                  <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dot}`} />
                                  <div className="flex items-start gap-3">
                                    <span className="text-xs font-bold text-slate-400 w-12 flex-shrink-0 mt-0.5">{ev.time}</span>
                                    <div className="flex-1 bg-slate-50 rounded-xl p-3">
                                      <p className="font-semibold text-slate-900 text-sm">{ev.label}</p>
                                      {ev.note && <p className="text-xs text-slate-500 mt-0.5">{ev.note}</p>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'costs' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">Estimated Cost per Person</h2>
                  <div className="flex h-6 rounded-full overflow-hidden mb-5 gap-0.5">
                    {[
                      { label: 'Flight', amount: flightEst, color: 'bg-blue-500' },
                      { label: 'Hotel', amount: hotelEst, color: 'bg-purple-500' },
                      { label: 'Activities', amount: activityEst, color: 'bg-emerald-500' },
                      { label: 'Food', amount: foodEst, color: 'bg-orange-400' },
                    ].map(item => (
                      <div key={item.label} className={`${item.color}`}
                        style={{ width: `${Math.round((item.amount / totalCost) * 100)}%` }} />
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Flight (return)', amount: flightEst, color: 'bg-blue-500', icon: Plane },
                      { label: 'Hotel', amount: hotelEst, color: 'bg-purple-500', icon: Building2 },
                      { label: 'Activities & Tours', amount: activityEst, color: 'bg-emerald-500', icon: Camera },
                      { label: 'Food & Dining', amount: foodEst, color: 'bg-orange-400', icon: Utensils },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.round((item.amount / totalCost) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
                    <p className="font-bold text-slate-900 text-base">Total per person</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">per person estimate</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <a
                      href={`/payment?amount=${totalCost * (memberCount || 1)}&trip=${encodeURIComponent(groupName + ' — ' + leadingDest.name)}&from=${encodeURIComponent(leadingDest.name)}&to=${encodeURIComponent(leadingDest.name)}&mode=flight&travelers=${memberCount || 1}`}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20">
                      <CreditCard className="w-4 h-4" /> Book Group Trip
                    </a>
                    <p className="text-center text-xs text-slate-400 mt-2">
                      {formatCurrency(totalCost * (memberCount || 1))} total · {memberCount || 1} travelers
                    </p>
                  </div>
                </div>
                {memberCount > 1 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-emerald-900 text-sm">Group Savings</h3>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 mb-1">Save up to 20%</p>
                    <p className="text-xs text-emerald-700/70">Book as a group of {memberCount} and unlock exclusive group rates on hotels and tours</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flights' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center py-12">
                <Plane className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 mb-2">Search Flights for This Trip</h3>
                <p className="text-sm text-slate-500 mb-5">Find the best flights from your city to {leadingDest.name}</p>
                <Link href={`/search?to=${encodeURIComponent(leadingDest.name)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                  Search Flights <Plane className="w-4 h-4" />
                </Link>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {groupEventToast && (
                  <div className="bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2 shadow-md">
                    <span>✓</span><span>{groupEventToast} added to group itinerary!</span>
                  </div>
                )}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2 text-sm text-indigo-700">
                  <PartyPopper className="w-4 h-4 flex-shrink-0" />
                  <span>Things to do around <strong>{leadingDest.name}</strong> — tap any event to add it to the group plan.</span>
                </div>
                {getGroupEvents(leadingDest.name).map((event, idx) => {
                  const isAdded = addedGroupEvents.has(idx)
                  return (
                    <div key={idx} className={'bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ' + (isAdded ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100')}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                          {event.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{event.name}</h3>
                            <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{event.price}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap mt-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${CAT_COLORS[event.category] || 'bg-slate-50 text-slate-600'}`}>
                              {event.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />{event.date}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />{event.venue}
                            </span>
                            <button
                              onClick={() => {
                                setAddedGroupEvents(prev => {
                                  const next = new Set(prev)
                                  if (next.has(idx)) { next.delete(idx) } else { next.add(idx) }
                                  return next
                                })
                                if (!isAdded) {
                                  setGroupEventToast(event.name)
                                  setTimeout(() => setGroupEventToast(''), 2500)
                                }
                              }}
                              className={'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ' + (isAdded ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm')}
                            >
                              {isAdded ? '✓ Added' : '+ Add to Plan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {addedGroupEvents.size > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-emerald-800 font-semibold">{addedGroupEvents.size} event{addedGroupEvents.size !== 1 ? 's' : ''} added to group plan</span>
                    <button onClick={() => setActiveTab('itinerary')}
                      className="text-xs text-emerald-700 font-bold underline hover:no-underline">
                      View Itinerary →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />Trip at a Glance
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Destination', value: leadingDest.name },
                  { label: 'Duration', value: `${itineraryDays.length} days` },
                  { label: 'Dates', value: dateLabel },
                  { label: 'Travelers', value: `${memberCount || 1} members` },
                  { label: 'Est. per person', value: formatCurrency(totalCost) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className="text-xs font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Cost Summary</h3>
              <div className="text-3xl font-bold text-blue-600 mb-0.5">{formatCurrency(totalCost)}</div>
              <p className="text-xs text-slate-500 mb-4">estimated per person</p>
              <div className="space-y-2">
                {[
                  { label: 'Flight', amount: flightEst, color: 'text-blue-600' },
                  { label: 'Hotel', amount: hotelEst, color: 'text-purple-600' },
                  { label: 'Activities', amount: activityEst, color: 'text-emerald-600' },
                  { label: 'Food', amount: foodEst, color: 'text-orange-500' },
                  ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-slate-500">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href={`/group/${id}/vote`}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white block hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              <ThumbsUp className="w-6 h-6 mb-3 opacity-80" />
              <h3 className="font-bold text-lg mb-1">Vote for {leadingDest.name}</h3>
              <p className="text-blue-200 text-xs mb-3">Help your group decide on this destination.</p>
              <div className="text-sm font-bold">Cast Your Vote</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
