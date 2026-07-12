'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency } from '@/lib/utils'
import {
  SlidersHorizontal, X, ThumbsUp, ArrowRight,
  Plane, Building2, TrendingUp, Zap, ChevronRight,
  Users, Copy, CheckCircle, MapPin, Music, Calendar, PartyPopper
} from 'lucide-react'
import type { Destination } from '@/types'

interface GroupData {
  id: string
  name: string
  from_city: string | null
  start_date: string | null
  end_date: string | null
  budget_per_person: number | null
  status: string
  winning_destination_id: string | null
  created_by: string
}

interface Vote {
  destination_id: string
  user_id: string
}

const FILTER_OPTIONS = [
  { label: 'Under $500', value: 'budget_500' },
  { label: 'Under $1,000', value: 'budget_1000' },
  { label: 'Beach', value: 'beach' },
  { label: 'City Trip', value: 'city' },
  { label: 'Most Voted', value: 'most_voted' },
]

export default function GroupDiscoveryPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [candidates, setCandidates] = useState<Destination[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: grp, error } = await supabase
        .from('group_trips').select('*').eq('id', id).single()

      if (error || !grp) {
        router.push('/group/' + id + '/join')
        return
      }
      setGroup(grp as GroupData)

      // Parse candidate destinations
      let destIds: string[] = []
      try {
        const parsed = JSON.parse(grp.winning_destination_id || '[]')
        if (Array.isArray(parsed)) destIds = parsed
      } catch { /* use fallback */ }
      const cands = destIds.length > 0
        ? DESTINATIONS.filter(d => destIds.includes(d.id))
        : DESTINATIONS.slice(0, 4)
      setCandidates(cands)

      // Load votes
      const { data: voteData } = await supabase
        .from('destination_votes')
        .select('destination_id, user_id')
        .eq('group_trip_id', id)
      setVotes((voteData || []) as Vote[])

      // Load member count
      const { count } = await supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_trip_id', id)
      setMemberCount(count || 0)

      setLoading(false)
    }
    init()
  }, [id])

  const toggleFilter = (val: string) =>
    setActiveFilters(prev => prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val])

  const copyInviteLink = async () => {
    const link = window.location.origin + '/group/' + id + '/join'
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getVoteCount = (destId: string) =>
    votes.filter(v => v.destination_id === destId).length

  const totalVotes = votes.length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Sort by votes
  let sortedCandidates = [...candidates].sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id))

  // Apply filters
  if (activeFilters.includes('budget_500')) {
    sortedCandidates = sortedCandidates.filter(d => d.avg_cost_per_day <= 100)
  } else if (activeFilters.includes('budget_1000')) {
    sortedCandidates = sortedCandidates.filter(d => d.avg_cost_per_day <= 150)
  }
  if (activeFilters.includes('beach')) {
    sortedCandidates = sortedCandidates.filter(d =>
      d.tags.some(t => t.toLowerCase().includes('beach') || t.toLowerCase().includes('island'))
    )
  }
  if (activeFilters.includes('city')) {
    sortedCandidates = sortedCandidates.filter(d =>
      d.tags.some(t => t.toLowerCase().includes('city'))
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                {group?.name || 'Group Trip'}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">Destination Plans</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Invite'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all',
                  showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <SlidersHorizontal className="w-4 h-4" />Filters
              </button>
            </div>
          </div>
          {/* Filter chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleFilter(opt.value)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  activeFilters.includes(opt.value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300',
                ].join(' ')}
              >
                {opt.label}
                {activeFilters.includes(opt.value) && (
                  <X className="w-3 h-3 inline ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{candidates.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Destinations</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{totalVotes}</p>
            <p className="text-xs text-slate-500 mt-0.5">Votes Cast</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-purple-600">{memberCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Members</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Plan Cards */}
          <div className="flex-1 space-y-4">
            {sortedCandidates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">No destinations match your filters</p>
                <button
                  onClick={() => setActiveFilters([])}
                  className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : sortedCandidates.map((dest, rank) => {
              const voteCount = getVoteCount(dest.id)
              const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
              const isLeading = rank === 0 && voteCount > 0

              return (
                <div key={dest.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="relative w-40 flex-shrink-0">
                      <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover min-h-[160px]" />
                      {isLeading && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />Leading
                        </div>
                      )}
                      {rank === 0 && voteCount === 0 && (
                        <div className="absolute top-2 left-2 bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                          #{rank + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{dest.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{dest.country}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(dest.avg_cost_per_day)}<span className="text-xs font-normal text-slate-400">/day</span></p>
                          <p className="text-xs text-slate-400">avg per person</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {dest.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>

                      {/* Vote bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />{voteCount} vote{voteCount !== 1 ? 's' : ''}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={[
                              'h-full rounded-full transition-all duration-700',
                              isLeading ? 'bg-amber-500' : 'bg-blue-400',
                            ].join(' ')}
                            style={{ width: pct + '%' }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={'/group/' + id + '/vote'}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />Vote
                        </Link>
                        <Link
                          href={'/group/' + id + '/itinerary'}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          View Plan <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Invite card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-bold text-blue-200 uppercase">Grow the group</span>
              </div>
              <p className="font-bold text-lg mb-1">{memberCount} member{memberCount !== 1 ? 's' : ''} so far</p>
              <p className="text-blue-100 text-sm mb-4">Share the link to invite more friends to vote.</p>
              <button
                onClick={copyInviteLink}
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
            </div>

            {/* Group Info */}
            {group && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Trip Details</h3>
                <div className="space-y-3">
                  {group.from_city && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">From</span>
                      <span className="font-semibold text-slate-900">{group.from_city}</span>
                    </div>
                  )}
                  {group.start_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Depart</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(group.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {group.end_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Return</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(group.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {group.budget_per_person && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Budget</span>
                      <span className="font-bold text-blue-700">{formatCurrency(group.budget_per_person)}/person</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Local Events for leading destination */}
            {sortedCandidates.length > 0 && (() => {
              const leading = sortedCandidates[0]
              const eventsMap: Record<string, Array<{emoji: string; name: string; date: string; price: string; category: string}>> = {
                tokyo:     [{emoji:'🎷',name:'Shinjuku Jazz Night',date:'Fri & Sat',price:'$15',category:'music'},{emoji:'🍣',name:'Tsukiji Market Tour',date:'Daily 5am',price:'Free',category:'food'},{emoji:'👘',name:'Harajuku Fashion Show',date:'Sundays',price:'Free',category:'art'}],
                paris:     [{emoji:'🎨',name:'Musee dOrsay Nights',date:'Thursdays',price:'$18',category:'art'},{emoji:'🍷',name:'Marais Food Festival',date:'Weekends',price:'Free',category:'food'},{emoji:'🎺',name:'Latin Quarter Jazz',date:'Fri & Sat',price:'$12',category:'music'}],
                bali:      [{emoji:'🔥',name:'Kecak Fire Dance',date:'Daily sunset',price:'$12',category:'festival'},{emoji:'🌕',name:'Full Moon Beach Party',date:'Monthly',price:'$20',category:'nightlife'},{emoji:'🥭',name:'Organic Bali Market',date:'Saturdays',price:'Free',category:'food'}],
                bangkok:   [{emoji:'🥊',name:'Muay Thai at Lumpinee',date:'Tue/Fri/Sat',price:'$30',category:'sports'},{emoji:'🛍️',name:'Chatuchak Market',date:'Sat & Sun',price:'Free',category:'food'},{emoji:'🌙',name:'Asiatique Night Bazaar',date:'Daily 5pm',price:'Free entry',category:'nightlife'}],
                rome:      [{emoji:'🎼',name:'Opera under Stars',date:'Summer',price:'$35',category:'music'},{emoji:'🍕',name:'Testaccio Food Tour',date:'Daily',price:'$25',category:'food'},{emoji:'🏛️',name:'Vatican Night Tour',date:'Fridays',price:'$40',category:'art'}],
                barcelona: [{emoji:'🎧',name:'Sonar Festival',date:'June',price:'$80/day',category:'festival'},{emoji:'💃',name:'Flamenco Show',date:'Nightly',price:'$40',category:'art'},{emoji:'🥘',name:'La Boqueria Tour',date:'Daily',price:'Free',category:'food'}],
                dubai:     [{emoji:'🌆',name:'Burj Light Show',date:'Daily 8pm',price:'Free',category:'art'},{emoji:'🛍️',name:'Dubai Shopping Fest',date:'Jan-Feb',price:'Free',category:'festival'},{emoji:'🎵',name:'Dubai Jazz Festival',date:'Feb/March',price:'$30+',category:'music'}],
                sydney:    [{emoji:'💡',name:'Vivid Sydney',date:'May-June',price:'Free',category:'festival'},{emoji:'🎻',name:'Opera House Concert',date:'Nightly',price:'$50+',category:'music'},{emoji:'🌿',name:'Bondi Farmers Market',date:'Saturdays',price:'Free',category:'food'}],
                chicago:   [{emoji:'🎷',name:'Chicago Jazz Fest',date:'Sept',price:'Free',category:'music'},{emoji:'🌭',name:'Chicago Food Fest',date:'Summer',price:'Free entry',category:'food'},{emoji:'🎨',name:'Art Institute Night',date:'Thursdays',price:'$25',category:'art'}],
              }
              const catColors: Record<string, string> = {music:'bg-purple-100 text-purple-700',food:'bg-orange-100 text-orange-700',art:'bg-blue-100 text-blue-700',festival:'bg-pink-100 text-pink-700',nightlife:'bg-indigo-100 text-indigo-700',sports:'bg-emerald-100 text-emerald-700'}
              const lower = leading.name.toLowerCase()
              const key = Object.keys(eventsMap).find(k => lower.includes(k.replace('_',' ')) || lower.includes(k))
              const events = key ? eventsMap[key] : [{emoji:'🎉',name:'Local Festival',date:'Monthly',price:'Varies',category:'festival'},{emoji:'🍽️',name:'Food Market',date:'Weekends',price:'Free',category:'food'},{emoji:'🎶',name:'Live Music Night',date:'Fri & Sat',price:'$10',category:'music'}]
              return (
                <div key="events" className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <PartyPopper className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Local Events in {leading.name}</h3>
                  </div>
                  <div className="space-y-2.5">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-lg leading-none mt-0.5">{ev.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{ev.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5 text-xs text-slate-400">
                              <Calendar className="w-2.5 h-2.5" />{ev.date}
                            </span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${catColors[ev.category] || 'bg-slate-100 text-slate-600'}`}>{ev.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href={'/group/' + id + '/itinerary'}
                    className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                    Add to itinerary <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )
            })()}

            {/* Quick nav */}
            <div className="space-y-2">
              <Link href={'/group/' + id + '/vote'}
                className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm">
                <span className="flex items-center gap-2"><ThumbsUp className="w-4 h-4" />Cast Your Vote</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href={'/group/' + id + '/itinerary'}
                className="flex items-center justify-between w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm">
                <span className="flex items-center gap-2"><Plane className="w-4 h-4" />View Itinerary</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
