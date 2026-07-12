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
  ArrowRight, MapPin, Clock, CheckCircle, Plane,
  Building2, Star, Calendar, Users, Share2, Edit2,
  ChevronRight, Bike, Camera, Utensils, Sunset, Info,
  Music, Ticket, PartyPopper, CreditCard
} from 'lucide-react'
import type { Trip, Destination, TransportOption, Hotel, Activity } from '@/types'

// Day color/icon configs
const DAY_CONFIGS = [
  { color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500', Icon: Plane },
  { color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500', Icon: Camera },
  { color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500', Icon: Bike },
  { color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500', Icon: Sunset },
  { color: 'bg-pink-100 text-pink-600', dot: 'bg-pink-500', Icon: Utensils },
]

// Destination-specific itinerary templates
const ITINERARY_TEMPLATES: Record<string, Array<{title: string; events: string[]}>> = {
  tokyo: [
    { title: 'Arrival & Shibuya', events: ['Land at Narita Airport', 'Check in to hotel', 'Explore Shibuya Crossing', 'Dinner at Ichiran Ramen'] },
    { title: 'Traditional Tokyo', events: ['Sensoji Temple at sunrise', 'Asakusa neighborhood walk', 'TeamLab Planets digital art', 'Omoide Yokocho alley bars'] },
    { title: 'Harajuku & Culture', events: ['Meiji Shrine morning visit', 'Harajuku Takeshita Street', 'Yoyogi Park picnic', 'Shinjuku night out'] },
    { title: 'Day Trip & Departure', events: ['Bullet train to Kamakura', 'Giant Buddha & temples', 'Return to Tokyo', 'Final sushi dinner'] },
  ],
  paris: [
    { title: 'Arrival & Montmartre', events: ['Land at CDG, take RER B', 'Check in & freshen up', 'Sacre-Coeur Basilica', 'Dinner in Montmartre'] },
    { title: 'Icons of Paris', events: ['Eiffel Tower at opening time', 'Champs-Elysees stroll', 'Louvre Museum highlights', 'Seine River cruise at sunset'] },
    { title: 'Art & Neighborhoods', events: ['Musee dOrsay morning', 'Le Marais neighborhood', 'Afternoon patisserie tour', 'Jazz bar in Saint-Germain'] },
    { title: 'Day Trip & Departure', events: ['Day trip to Versailles', 'Palace and gardens tour', 'Return to Paris', 'Farewell dinner at brasserie'] },
  ],
  bali: [
    { title: 'Arrival & Seminyak', events: ['Land at Ngurah Rai Airport', 'Check in to villa', 'Sunset at Seminyak Beach', 'Dinner at Ku De Ta'] },
    { title: 'Ubud & Rice Terraces', events: ['Sunrise at Tegallalang terraces', 'Monkey Forest Sanctuary', 'Ubud Art Market', 'Kecak Fire Dance at Uluwatu'] },
    { title: 'Surf & Temple Hop', events: ['Morning surf lesson at Kuta', 'Brunch at Sisterfields', 'Tanah Lot sea temple', 'Night at La Favela'] },
    { title: 'Wellness & Departure', events: ['Tirta Empul holy springs', 'Tegenungan Waterfall swim', 'Spa treatment', 'Farewell dinner at Mozaic'] },
  ],
  sydney: [
    { title: 'Arrival & The Rocks', events: ['Land at Kingsford Smith', 'Hotel check-in, CBD', 'Opera House & Harbour Bridge', 'Dinner at Circular Quay'] },
    { title: 'Beaches & Bondi', events: ['Bondi Beach sunrise swim', 'Bondi to Coogee coastal walk', 'Lunch at North Bondi Fish', 'Surry Hills food & bar crawl'] },
    { title: 'Blue Mountains', events: ['Day trip Blue Mountains', 'Three Sisters viewpoint', 'Echo Point lookout', 'Return via Katoomba'] },
    { title: 'Darling Harbour & Fly Out', events: ['SEA LIFE Aquarium', 'Darling Harbour waterfront', 'Last lunch at Barangaroo', 'Transfer to airport'] },
  ],
  new_york: [
    { title: 'Arrival & Midtown', events: ['Land at JFK, subway to city', 'Hotel check-in, Midtown', 'Times Square at night', 'Dinner in Hells Kitchen'] },
    { title: 'Icons & Culture', events: ['Central Park morning jog', 'Metropolitan Museum of Art', 'High Line walk', 'Greenwich Village dinner'] },
    { title: 'Brooklyn & Beyond', events: ['Brooklyn Bridge walk', 'DUMBO coffee & views', 'Brooklyn Flea Market', 'Rooftop bar at sunset'] },
    { title: 'Shopping & Departure', events: ['5th Avenue shopping', 'One World Trade Center', 'Lunch at Chelsea Market', 'Transfer to airport'] },
  ],
  bangkok: [
    { title: 'Arrival & Silom', events: ['Land at Suvarnabhumi', 'BTS Skytrain to hotel', 'Wat Arun riverside visit', 'Silom street food tour'] },
    { title: 'Temples & Markets', events: ['Grand Palace & Wat Pho', 'Khao San Road lunch', 'Chatuchak Weekend Market', 'Rooftop bar at dusk'] },
    { title: 'Canal Tour & Malls', events: ['Long-tail boat canal tour', 'Jim Thompson House', 'MBK Center & Siam Paragon', 'Night market dinner'] },
    { title: 'Day Trip & Departure', events: ['Day trip to Ayutthaya', 'Ancient temple ruins', 'Return to Bangkok', 'Farewell Thai dinner'] },
  ],
  rome: [
    { title: 'Arrival & Centro Storico', events: ['Arrive Leonardo da Vinci', 'Colosseum & Roman Forum', 'Trevi Fountain toss', 'Dinner in Trastevere'] },
    { title: 'Vatican & Art', events: ['Vatican Museums & Sistine Chapel', 'St Peters Basilica dome', 'Castel SantAngelo', 'Campo de Fiori evening'] },
    { title: 'Neighborhoods & Food', events: ['Testaccio food market', 'Borghese Gallery art', 'Pasta making class', 'Aperitivo in Pigneto'] },
    { title: 'Day Trip & Departure', events: ['Day trip to Pompeii', 'Mount Vesuvius viewpoint', 'Return to Rome', 'Farewell pasta dinner'] },
  ],
  barcelona: [
    { title: 'Arrival & Gothic Quarter', events: ['Land at El Prat', 'Check in, Gothic Quarter', 'La Rambla evening stroll', 'Tapas in El Born'] },
    { title: 'Gaudi & Architecture', events: ['Sagrada Familia tour', 'Park Guell morning', 'Casa Batllo facade', 'Barceloneta beach afternoon'] },
    { title: 'Markets & Mountains', events: ['La Boqueria market', 'Picasso Museum', 'Montjuic cable car', 'Flamenco show evening'] },
    { title: 'Gracia & Departure', events: ['Gracia neighborhood brunch', 'Camp Nou stadium tour', 'Last tapas lunch', 'Transfer to airport'] },
  ],
  dubai: [
    { title: 'Arrival & Downtown', events: ['Land at Dubai International', 'Hotel check-in, Downtown', 'Burj Khalifa At the Top', 'Dubai Fountain show & dinner'] },
    { title: 'Old Dubai & Gold Souk', events: ['Al Fahidi Historic District', 'Gold & Spice Souk', 'Abra crossing Dubai Creek', 'Arabian Tea House lunch'] },
    { title: 'Desert Safari', events: ['Dune bashing 4WD', 'Camel ride at sunset', 'Bedouin camp dinner', 'Stargazing in the desert'] },
    { title: 'Beaches & Departure', events: ['Jumeirah Beach morning swim', 'Palm Jumeirah drive', 'Dubai Mall last shopping', 'Transfer to airport'] },
  ],
}

function getItinerary(destName: string): Array<{title: string; events: string[]}> {
  const lower = destName.toLowerCase()
  for (const [key, plan] of Object.entries(ITINERARY_TEMPLATES)) {
    if (lower.includes(key.replace('_', ' ')) || lower.includes(key)) return plan
  }
  // Generic fallback
  return [
    { title: 'Arrival & Orientation', events: ['Land at airport, collect luggage', 'Transfer to accommodation', 'Explore nearby neighborhood', 'Welcome dinner at local restaurant'] },
    { title: 'Culture & Sights', events: ['Visit top landmark & museum', 'Guided city walking tour', 'Local market & street food', 'Sunset at scenic viewpoint'] },
    { title: 'Adventure & Leisure', events: ['Day activity or excursion', 'Lunch with a view', 'Afternoon at leisure / spa', 'Rooftop bar or night out'] },
    { title: 'Final Day & Departure', events: ['Morning at leisure', 'Last local breakfast', 'Souvenir shopping', 'Transfer to airport'] },
  ]
}

// ------- Local Events Data -------
interface LocalEvent {
  id: string
  name: string
  category: 'festival' | 'music' | 'food' | 'sports' | 'art' | 'nightlife'
  emoji: string
  date: string
  venue: string
  price: string
  description: string
}

const LOCAL_EVENTS: Record<string, LocalEvent[]> = {
  tokyo: [
    { id: 'e1', name: 'Shinjuku Jazz Night', category: 'music', emoji: '🎷', date: 'Fri & Sat evenings', venue: 'Shinjuku Pit Inn', price: '$15', description: 'World-class jazz in one of Tokyos legendary underground clubs.' },
    { id: 'e2', name: 'Tsukiji Outer Market Tour', category: 'food', emoji: '🍣', date: 'Daily from 5am', venue: 'Tsukiji Market', price: 'Free', description: 'Join the early-morning fish auction and taste the freshest sushi in Japan.' },
    { id: 'e3', name: 'Harajuku Street Fashion Show', category: 'art', emoji: '👘', date: 'Sundays', venue: 'Takeshita Street', price: 'Free', description: 'Witness Tokyos wild fashion subculture up close — cosplay, Lolita, and beyond.' },
    { id: 'e4', name: 'Akihabara Gaming Festival', category: 'festival', emoji: '🎮', date: 'Monthly', venue: 'Akihabara', price: '$10', description: 'Indie game dev showcases, retro arcades, and live esports competitions.' },
  ],
  paris: [
    { id: 'e1', name: 'Musee dOrsay Night Opening', category: 'art', emoji: '🎨', date: 'Every Thursday', venue: 'Musee dOrsay', price: '$18', description: 'Explore Monets and Renoirs under ambient lighting until 9:45pm.' },
    { id: 'e2', name: 'Marais Food & Wine Festival', category: 'food', emoji: '🍷', date: 'Weekends', venue: 'Le Marais District', price: 'Free entry', description: 'Open-air tasting events with Parisian chefs, natural wines, and artisan cheese.' },
    { id: 'e3', name: 'Latin Quarter Jazz Crawl', category: 'music', emoji: '🎺', date: 'Fri & Sat nights', venue: 'Saint-Michel area', price: '$12', description: 'Three bars, one wristband — a guided tour through Pariss jazz underground.' },
    { id: 'e4', name: 'Bastille Night Market', category: 'nightlife', emoji: '✨', date: 'Thursday evenings', venue: 'Place de la Bastille', price: 'Free', description: 'The famous open-air market transforms into an evening social — food, music, lights.' },
  ],
  bali: [
    { id: 'e1', name: 'Kecak Fire Dance', category: 'festival', emoji: '🔥', date: 'Daily at sunset', venue: 'Uluwatu Temple', price: '$12', description: 'Ancient Balinese chant-drama performed on a clifftop stage above the Indian Ocean.' },
    { id: 'e2', name: 'Ubud Writers Festival', category: 'art', emoji: '📚', date: 'Annually in Oct', venue: 'Ubud Palace', price: 'Varies', description: 'International authors and local voices discuss travel, culture, and change.' },
    { id: 'e3', name: 'Full Moon Beach Party', category: 'nightlife', emoji: '🌕', date: 'Monthly full moon', venue: 'Double-Six Beach, Seminyak', price: '$20', description: 'Balis most iconic beach rave — world DJs, fire dancers, and sunrise swims.' },
    { id: 'e4', name: 'Organic Bali Market', category: 'food', emoji: '🥭', date: 'Saturdays', venue: 'Saren Indah Hotel, Ubud', price: 'Free', description: 'Farm-to-table breakfast market with local produce, smoothie bowls, and live gamelan.' },
  ],
  bangkok: [
    { id: 'e1', name: 'Muay Thai Night at Lumpinee', category: 'sports', emoji: '🥊', date: 'Tue, Fri, Sat', venue: 'Lumpinee Boxing Stadium', price: '$30', description: 'Watch elite Muay Thai fighters compete in Bangkoks most prestigious ring.' },
    { id: 'e2', name: 'Chatuchak Weekend Market', category: 'food', emoji: '🛍️', date: 'Sat & Sun', venue: 'Chatuchak Market', price: 'Free', description: '15,000+ stalls of vintage, street food, crafts, and fashion. Arrive early!' },
    { id: 'e3', name: 'Asiatique Night Bazaar', category: 'nightlife', emoji: '🌙', date: 'Daily 5pm–midnight', venue: 'Chao Phraya Riverside', price: 'Free entry', description: 'Riverfront night market with 40 warehouses, Ferris wheel, and live cabaret.' },
    { id: 'e4', name: 'Bangkok Jazz Festival', category: 'music', emoji: '🎸', date: 'Monthly', venue: 'RCA Entertainment Complex', price: '$15', description: 'Live jazz and fusion performances in one of Southeast Asias coolest music hubs.' },
  ],
  new_york: [
    { id: 'e1', name: 'Smorgasburg Food Market', category: 'food', emoji: '🌮', date: 'Saturdays (Apr–Nov)', venue: 'Prospect Park, Brooklyn', price: 'Free entry', description: '100+ local vendors serving New Yorks most creative street food all in one spot.' },
    { id: 'e2', name: 'Comedy at The Stand NYC', category: 'nightlife', emoji: '😂', date: 'Nightly', venue: 'The Stand, Gramercy', price: '$20', description: 'Top stand-up comedians in a cozy club — surprise celebrity drop-ins happen often.' },
    { id: 'e3', name: 'Central Park SummerStage', category: 'music', emoji: '🎤', date: 'June–Sept', venue: 'Central Park Rumsey Playfield', price: 'Free–$35', description: 'Outdoor music festival with hip-hop, indie, and global artists throughout summer.' },
    { id: 'e4', name: 'High Line Art Walk', category: 'art', emoji: '🗽', date: 'Daily', venue: 'The High Line, Chelsea', price: 'Free', description: 'Rotating public art installations along New Yorks iconic elevated park — always fresh.' },
  ],
  rome: [
    { id: 'e1', name: 'Opera under the Stars', category: 'music', emoji: '🎼', date: 'Summer evenings', venue: 'Terme di Caracalla', price: '$35', description: 'Open-air opera in ancient Roman baths — an unmatched atmospheric experience.' },
    { id: 'e2', name: 'Testaccio Food Tour', category: 'food', emoji: '🍕', date: 'Daily', venue: 'Testaccio Market', price: '$25 guided', description: 'Romes working-class neighborhood and the birthplace of traditional Roman cuisine.' },
    { id: 'e3', name: 'Aperitivo Hour at Campo de Fiori', category: 'nightlife', emoji: '🍸', date: 'Daily 5–8pm', venue: 'Campo de Fiori', price: 'Free', description: 'Join locals for spritz and small bites in the liveliest piazza in central Rome.' },
    { id: 'e4', name: 'Vatican Museums Night Tour', category: 'art', emoji: '🏛️', date: 'Friday evenings', venue: 'Vatican City', price: '$40', description: 'Skip daytime crowds and see the Sistine Chapel under soft Friday night lighting.' },
  ],
  barcelona: [
    { id: 'e1', name: 'Sonar Music Festival', category: 'festival', emoji: '🎧', date: 'June annually', venue: 'Various venues', price: '$80/day', description: 'Barcelonas legendary electronic music and arts festival — 3 days of world DJs.' },
    { id: 'e2', name: 'La Boqueria Market Tour', category: 'food', emoji: '🥘', date: 'Daily (closed Sun)', venue: 'La Rambla', price: 'Free', description: 'One of Europes greatest food markets — fresh seafood, iberico ham, and local sweets.' },
    { id: 'e3', name: 'Flamenco Show at Tablao', category: 'art', emoji: '💃', date: 'Nightly', venue: 'El Tablao de Carmen, El Poble Espanyol', price: '$40', description: 'Authentic flamenco performance in one of Barcelonas most intimate historic venues.' },
    { id: 'e4', name: 'Beach Football at Barceloneta', category: 'sports', emoji: '⚽', date: 'Evenings', venue: 'Barceloneta Beach', price: 'Free', description: 'Join pickup beach football sessions with locals as the sun sets over the Mediterranean.' },
  ],
  dubai: [
    { id: 'e1', name: 'Dubai Shopping Festival', category: 'festival', emoji: '🛍️', date: 'Jan–Feb', venue: 'City-wide', price: 'Free', description: 'Global sales, live concerts, fireworks, and raffles across the entire city.' },
    { id: 'e2', name: 'Burj Khalifa Light Show', category: 'art', emoji: '🌆', date: 'Daily at 8pm & 10pm', venue: 'Downtown Dubai', price: 'Free', description: 'The worlds tallest building transforms into a canvas for a stunning laser and light show.' },
    { id: 'e3', name: 'Spice Souk Evening Walk', category: 'food', emoji: '🌶️', date: 'Daily (evenings best)', venue: 'Deira Spice Souk', price: 'Free', description: 'Wind through narrow alleyways packed with saffron, frankincense, and exotic spices.' },
    { id: 'e4', name: 'Dubai Jazz Festival', category: 'music', emoji: '🎵', date: 'Feb/March annually', venue: 'Dubai Media City', price: '$30+', description: 'International jazz and pop acts performing under the desert sky for three nights.' },
  ],
  sydney: [
    { id: 'e1', name: 'Vivid Sydney Light Festival', category: 'festival', emoji: '💡', date: 'May–June annually', venue: 'Circular Quay & City', price: 'Free', description: 'The worlds largest light, music and ideas festival transforms the Sydney skyline.' },
    { id: 'e2', name: 'Bondi Farmers Market', category: 'food', emoji: '🌿', date: 'Saturdays', venue: 'Bondi Beach Promenade', price: 'Free', description: 'Fresh local produce, artisan food, and live music steps from the iconic beach.' },
    { id: 'e3', name: 'Sydney Opera House Concert', category: 'music', emoji: '🎻', date: 'Nightly', venue: 'Sydney Opera House', price: '$50+', description: 'World-class symphony, ballet, and opera performances in an architectural icon.' },
    { id: 'e4', name: 'Taronga Zoo Night Lights', category: 'art', emoji: '🦁', date: 'Dec–Jan', venue: 'Taronga Zoo, Mosman', price: '$45', description: 'Walk through illuminated wildlife habitats after dark in a magical seasonal event.' },
  ],
}

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  festival: 'bg-pink-50 text-pink-700 border-pink-200',
  music: 'bg-purple-50 text-purple-700 border-purple-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  art: 'bg-blue-50 text-blue-700 border-blue-200',
  nightlife: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

function getLocalEvents(destName: string): LocalEvent[] {
  const lower = destName.toLowerCase()
  for (const [key, events] of Object.entries(LOCAL_EVENTS)) {
    if (lower.includes(key.replace('_', ' ')) || lower.includes(key)) return events
  }
  // Generic fallback events
  return [
    { id: 'g1', name: 'Local Food Market', category: 'food', emoji: '🍽️', date: 'Weekends', venue: 'City Center', price: 'Free entry', description: 'Explore the local food scene at the popular weekend market — fresh produce, street food, and live music.' },
    { id: 'g2', name: 'City Walking Tour', category: 'art', emoji: '🗺️', date: 'Daily 10am', venue: 'Main Square', price: 'Free (tips welcome)', description: 'Join a free walking tour and discover the hidden gems, history, and architecture of the city.' },
    { id: 'g3', name: 'Live Music Night', category: 'music', emoji: '🎶', date: 'Fri & Sat evenings', venue: 'Local Venue', price: '$10–20', description: 'The local music scene comes alive every weekend — from jazz to indie and everything in between.' },
    { id: 'g4', name: 'Cultural Festival', category: 'festival', emoji: '🎉', date: 'Monthly', venue: 'Cultural Center', price: 'Varies', description: 'A celebration of local traditions, art, and cuisine that draws locals and visitors alike.' },
  ]
}

export default function TripDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [destination, setDestination] = useState<Destination | null>(null)
  const [transport, setTransport] = useState<TransportOption | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'events'>('overview')
  const [shareToast, setShareToast] = useState(false)
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set())
  const [eventToast, setEventToast] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: tripData } = await supabase
          .from('trips').select('*').eq('id', id).single()

        if (!tripData) { setLoading(false); return }
        setTrip(tripData)

        let dest = DESTINATIONS.find(d => d.id === tripData.destination_id) || null
        if (!dest && tripData.destination_name) {
          dest = {
            id: tripData.destination_id || 'custom',
            name: tripData.destination_name,
            country: tripData.destination_country || '',
            city: tripData.destination_name,
            description: tripData.destination_name + ', ' + (tripData.destination_country || ''),
            image_url: getRandomTripImage(tripData.id),
            highlights: [], best_months: [], avg_temp: '', currency: '', language: '', timezone: '',
          } as any
        }
        setDestination(dest)

        const trans = TRANSPORT_OPTIONS.find(t => t.id === tripData.transport_option_id) || null
        setTransport(trans)

        const h = HOTELS.find(h => h.id === tripData.hotel_id) || null
        setHotel(h)

        const acts = dest ? ACTIVITIES.filter(a => a.destination_id === dest.id) : []
        setActivities(acts.slice(0, 4))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    })
  }

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
          <p className="text-slate-500 mb-4">Trip not found</p>
          <Link href="/home" className="text-blue-600 font-semibold hover:underline">Back to Home</Link>
        </div>
      </div>
    )
  }

  const destName = destination?.name || trip.destination_name || 'Your Destination'
  const destCountry = destination?.country || trip.destination_country || ''

  const days = getDaysBetween(trip.start_date || '', trip.end_date || '') || 5
  const flightCost = transport?.price || (trip.total_cost && !hotel ? trip.total_cost : 0)
  const hotelTotal = (hotel?.price_per_night || 0) * days
  const activityTotal = activities.reduce((s, a) => s + a.price, 0)
  const displayTotal = trip.total_cost || (flightCost + hotelTotal + activityTotal)

  // Parse notes for Nominatim-searched trips
  const flightNotes = trip.notes && trip.notes.startsWith('Flight:') ? trip.notes : null

  const itinerary = getItinerary(destName)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-fade-in">
          Link copied to clipboard
        </div>
      )}

      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={trip.image_url || destination?.image_url || getRandomTripImage(trip.id)}
          alt={destName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/trips"
            className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/50 transition-colors">
            My Trips
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {trip.num_travelers === 1 ? 'SOLO' : 'GROUP'} ADVENTURE
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                    {trip.status}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{trip.title}</h1>
                <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
                  {trip.from_city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />{trip.from_city} to {destName}
                    </span>
                  )}
                  {trip.start_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />{formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />{trip.num_travelers} traveler{trip.num_travelers !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
                  title="Copy link"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          {(['overview', 'itinerary', 'events'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-sm font-bold capitalize border-b-2 transition-all ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Nominatim flight info card */}
                {flightNotes && !transport && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900">Your Flight</h2>
                        <p className="text-xs text-slate-500">{destCountry ? destName + ', ' + destCountry : destName}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />Saved
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-slate-700 text-center">{flightNotes}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Flight cost</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(trip.total_cost || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Static flight card */}
                {transport && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900">Confirmed Flight</h2>
                        <p className="text-xs text-slate-500">{transport.operator}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />Confirmed
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-900">{transport.departure_time}</p>
                          <p className="text-sm font-semibold text-slate-500 mt-1">{trip.from_city}</p>
                        </div>
                        <div className="flex-1 mx-6 flex flex-col items-center">
                          <p className="text-xs text-slate-500 mb-2">{transport.duration}</p>
                          <div className="w-full flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500" />
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
                            <Plane className="w-4 h-4 text-blue-600" />
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-500" />
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500" />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {transport.stops === 0 ? 'Non-stop' : transport.stops + ' stop'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-900">{transport.arrival_time}</p>
                          <p className="text-sm font-semibold text-slate-500 mt-1">{destination?.city || destName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Flight cost</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(transport.price)}</span>
                    </div>
                  </div>
                )}

                {/* Hotel card */}
                {hotel && (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="relative h-52">
                      <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-yellow-400 text-slate-900 px-2.5 py-1 rounded-full shadow-md">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-bold">{hotel.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-700">({hotel.review_count?.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{hotel.name}</h3>
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                            <MapPin className="w-3.5 h-3.5" />{hotel.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{formatCurrency(hotel.price_per_night)}</p>
                          <p className="text-xs text-slate-500">per night</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities?.slice(0, 4).map((a: string) => (
                          <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <span className="text-sm text-slate-600">{days} nights total</span>
                        <span className="text-xl font-bold text-purple-600">{formatCurrency(hotelTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {activities.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Camera className="w-4 h-4 text-emerald-600" />
                        </div>
                        Planned Activities
                      </h2>
                      <Link href={`/trips/${id}/breakdown`}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        View all<ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={activity.image_url} alt={activity.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{activity.name}</p>
                            <p className="text-xs text-slate-500">{activity.duration}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{formatCurrency(activity.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Activities total</span>
                      <span className="text-xl font-bold text-emerald-600">{formatCurrency(activityTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Cost summary */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                  <h2 className="font-bold text-lg mb-4">Total Trip Cost</h2>
                  <div className="text-5xl font-bold mb-1">{formatCurrency(displayTotal)}</div>
                  <p className="text-blue-200 text-sm mb-6">estimated total</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Flight', value: formatCurrency(flightCost) },
                      { label: 'Hotel', value: formatCurrency(hotelTotal) },
                      { label: 'Activities', value: formatCurrency(activityTotal) },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-blue-200">{item.label}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700 mb-4">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>This is a suggested itinerary for <strong>{destName}</strong>. Adjust it to your own schedule.</span>
                </div>
                {itinerary.map((day, idx) => {
                  const cfg = DAY_CONFIGS[idx % DAY_CONFIGS.length]
                  const Icon = cfg.Icon
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-11 h-11 rounded-xl ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day {idx + 1}</p>
                          <p className="font-bold text-slate-900">{day.title}</p>
                        </div>
                      </div>
                      <div className="relative pl-5">
                        <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-slate-100" />
                        <div className="space-y-3">
                          {day.events.map((ev, i) => (
                            <div key={i} className="relative flex items-center gap-3">
                              <div className={`absolute -left-5 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot}`} />
                              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 w-full">{ev}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="text-center pt-2">
                  <Link href="/group/create"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                    Plan this as a group trip <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {eventToast && (
                  <div className="bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2 shadow-md">
                    <span>✓</span> <span>{eventToast} added to your itinerary!</span>
                  </div>
                )}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2 text-sm text-indigo-700">
                  <PartyPopper className="w-4 h-4 flex-shrink-0" />
                  <span>Local events and experiences near <strong>{destName}</strong> — tap any event to add it to your plan.</span>
                </div>
                {getLocalEvents(destName).map((event) => {
                  const isAdded = addedEvents.has(event.id)
                  return (
                    <div key={event.id} className={'bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ' + (isAdded ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100')}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                          {event.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{event.name}</h3>
                            <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{event.price}</span>
                          </div>
                          <p className="text-sm text-slate-500 mb-3">{event.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${EVENT_CATEGORY_COLORS[event.category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
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
                                setAddedEvents(prev => {
                                  const next = new Set(prev)
                                  if (next.has(event.id)) { next.delete(event.id) } else { next.add(event.id) }
                                  return next
                                })
                                if (!isAdded) {
                                  setEventToast(event.name)
                                  setTimeout(() => setEventToast(''), 2500)
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
                {addedEvents.size > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-emerald-800 font-semibold">{addedEvents.size} event{addedEvents.size !== 1 ? 's' : ''} added to your plan</span>
                    <button onClick={() => setActiveTab('itinerary')}
                      className="text-xs text-emerald-700 font-bold underline hover:no-underline flex items-center gap-1">
                      View Itinerary <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { icon: Calendar, label: 'Duration', value: `${days} day${days !== 1 ? 's' : ''}` },
                  { icon: MapPin, label: 'Destination', value: destCountry ? `${destName}, ${destCountry}` : destName },
                  { icon: Users, label: 'Travelers', value: `${trip.num_travelers} person${trip.num_travelers !== 1 ? 's' : ''}` },
                  { icon: Clock, label: 'Status', value: trip.status.charAt(0).toUpperCase() + trip.status.slice(1) },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hotel mini card */}
            {hotel && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="relative h-32">
                  <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="font-bold text-white text-sm truncate">{hotel.name}</p>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{hotel.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Hotel</span>
                  <span className="text-sm font-bold text-purple-600">{formatCurrency(hotel.price_per_night)}/night</span>
                </div>
              </div>
            )}

            {/* Budget tracker */}
            {trip.budget && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Budget</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total budget</span>
                    <span className="font-bold text-slate-900">{formatCurrency(trip.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Planned cost</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(displayTotal)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((displayTotal / trip.budget) * 100, 100)}%`,
                        background: displayTotal > trip.budget ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                      }} />
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    {displayTotal > (trip.budget || 0)
                      ? `${formatCurrency(displayTotal - (trip.budget || 0))} over budget`
                      : `${formatCurrency((trip.budget || 0) - displayTotal)} remaining`}
                  </p>
                </div>
              </div>
            )}

            {/* Local Events teaser */}
            <div onClick={() => setActiveTab('events')}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Local Events</span>
              </div>
              <p className="text-white/80 text-xs mb-3">Discover festivals, concerts & more in {destName}.</p>
              <div className="flex items-center gap-1 flex-wrap">
                {getLocalEvents(destName).slice(0, 3).map(ev => (
                  <span key={ev.id} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{ev.emoji} {ev.name.split(' ')[0]}</span>
                ))}
              </div>
            </div>

            {/* Pay Now CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Ready to Book?</span>
              </div>
              <p className="text-blue-200 text-xs mb-4">Lock in your trip and complete payment securely.</p>
              <a
                href={`/payment?amount=${trip.total_cost || trip.budget || 0}&trip=${encodeURIComponent(trip.title)}&from=${encodeURIComponent(trip.from_city || '')}&to=${encodeURIComponent(destName)}&mode=flight&travelers=${trip.num_travelers}&tripId=${id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-sm transition-colors">
                <CreditCard className="w-4 h-4" /> Pay Now
              </a>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
              <Link href={`/trips/${id}/breakdown`}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors">
                <span className="flex items-center gap-2"><Building2 className="w-4 h-4" />Cost Breakdown</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/search"
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors">
                <span className="flex items-center gap-2"><Plane className="w-4 h-4" />Search More Flights</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/group/create"
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />Turn Into Group Trip</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
