'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS } from '@/lib/data/destinations'
import { formatCurrency } from '@/lib/utils'
import {
  Clock, LogOut, ThumbsUp, Users, Copy, CheckCircle,
  TrendingUp, Share2, MapPin, Star, Sparkles
} from 'lucide-react'
import type { Destination } from '@/types'

interface Member {
  id: string
  user_id: string
  role: string
  profile: { username: string | null; full_name: string | null } | null
}

interface Vote {
  id: string
  group_trip_id: string
  user_id: string
  destination_id: string
  voted_at: string
}

interface Group {
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

function getInitials(m: Member) {
  const name = m.profile?.full_name || m.profile?.username || 'User'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-pink-500', 'bg-purple-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-red-500',
  'bg-indigo-500', 'bg-teal-500',
]

export default function VotingPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allVotes, setAllVotes] = useState<Vote[]>([])
  const [myVote, setMyVote] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Destination[]>([])
  const [voting, setVoting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [justVoted, setJustVoted] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Clean up any existing channel immediately before async loadData runs
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    let cancelled = false
    const run = async () => {
      const cleanup = await loadData()
      if (cancelled && cleanup) cleanup()
    }
    run()
    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [id])

  const loadVotes = async () => {
    const { data } = await supabase
      .from('destination_votes')
      .select('*')
      .eq('group_trip_id', id)
    const votes = (data || []) as Vote[]
    setAllVotes(votes)
    return votes
  }

  const loadData = async (): Promise<() => void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return () => {} }
    setCurrentUserId(user.id)

    const { data: grp, error: grpErr } = await supabase
      .from('group_trips').select('*').eq('id', id).single()
    if (grpErr || !grp) {
      if (grpErr?.code === 'PGRST116') {
        router.push('/group/' + id + '/join')
      } else {
        setLoadError('Could not load this group. You may not be a member.')
        setLoading(false)
      }
      return () => {}
    }
    setGroup(grp as Group)

    // Parse candidates from winning_destination_id (stored as JSON while status='voting')
    // Supports two formats:
    //   1. Array of full objects: [{id, name, country, lat, lon}, ...] (Nominatim destinations)
    //   2. Array of string IDs: ['dest-paris', 'dest-tokyo'] (legacy DESTINATIONS list)
    let cands: typeof DESTINATIONS = []
    try {
      const parsed = JSON.parse(grp.winning_destination_id || '[]')
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'object' && parsed[0] !== null) {
          // Full destination objects — map to Destination shape
          const IMAGE_POOL = [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&w=800&q=80',
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&w=800&q=80',
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&w=800&q=80',
            'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&w=800&q=80',
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&w=800&q=80',
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&w=800&q=80',
          ]
          cands = parsed.map((d: any, i: number) => ({
            id: d.id,
            name: d.name,
            country: d.country,
            city: d.name,
            image_url: IMAGE_POOL[i % IMAGE_POOL.length],
            description: `Explore the best of ${d.name}, ${d.country}.`,
            tags: ['travel', 'explore'],
            avg_cost_per_day: 120,
            safety_score: 8,
            created_at: new Date().toISOString(),
          }))
        } else {
          // Legacy: array of destination ID strings
          const ids = parsed as string[]
          cands = DESTINATIONS.filter(d => ids.includes(d.id))
        }
      }
    } catch { /* ignore parse errors */ }
    if (cands.length === 0) cands = DESTINATIONS.slice(0, 4)
    setCandidates(cands)

    // Load members with profile data
    const { data: mems } = await supabase
      .from('group_members')
      .select('*, profile:profiles(username, full_name)')
      .eq('group_trip_id', id)
    setMembers((mems || []) as unknown as Member[])

    // Load existing votes
    const votes = await loadVotes()
    const myV = votes.find(v => v.user_id === user.id)
    setMyVote(myV?.destination_id || null)

    setLoading(false)

    // Subscribe to realtime — store in ref so cleanup is always synchronous
    const channel = supabase.channel('votes-' + id)
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'destination_votes',
      filter: 'group_trip_id=eq.' + id,
    }, () => { loadVotes() }).subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }

  const handleVote = async (destId: string) => {
    if (!currentUserId || voting) return
    if (myVote === destId) return // already voted for this
    setVoting(true)

    const prevVote = myVote
    setMyVote(destId)
    setJustVoted(destId)
    setTimeout(() => setJustVoted(null), 2000)

    // Optimistic update
    setAllVotes(prev => {
      const without = prev.filter(v => v.user_id !== currentUserId)
      return [...without, {
        id: 'temp', group_trip_id: id, user_id: currentUserId,
        destination_id: destId, voted_at: new Date().toISOString(),
      }]
    })

    try {
      if (prevVote) {
        const { error } = await supabase.from('destination_votes')
          .update({ destination_id: destId })
          .eq('group_trip_id', id).eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('destination_votes')
          .insert({ group_trip_id: id, user_id: currentUserId, destination_id: destId })
        if (error) throw error
      }
    } catch {
      // Rollback on error
      setMyVote(prevVote)
      setAllVotes(prev => prev.filter(v => v.id !== 'temp'))
    } finally {
      setVoting(false)
    }
  }

  const copyInviteLink = async () => {
    const link = window.location.origin + '/group/' + id + '/join'
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getVoteCount = (destId: string) =>
    allVotes.filter(v => v.destination_id === destId).length

  const hasVoted = (userId: string) =>
    allVotes.some(v => v.user_id === userId)

  const totalVotes = allVotes.length
  const votedCount = members.filter(m => hasVoted(m.user_id)).length
  const totalMembers = members.length

  const sortedCandidates = [...candidates].sort(
    (a, b) => getVoteCount(b.id) - getVoteCount(a.id)
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!group) return null

  const daysUntil = group.start_date
    ? Math.max(0, Math.ceil((new Date(group.start_date).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              {group.name}
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Vote for Your Destination</h1>
              {daysUntil !== null && (
                <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{daysUntil}d until trip</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Invite'}
            </button>
            <Link href={'/group/' + id + '/leave'}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 bg-red-50 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" />Leave
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Members participation panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {members.slice(0, 8).map((m, i) => {
                  const voted = hasVoted(m.user_id)
                  const isMe = m.user_id === currentUserId
                  return (
                    <div
                      key={m.id}
                      title={(m.profile?.full_name || m.profile?.username || 'Member') + (voted ? ' ✓ voted' : ' – waiting')}
                      className={[
                        'w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold transition-all',
                        AVATAR_COLORS[i % AVATAR_COLORS.length],
                        voted ? 'ring-2 ring-emerald-400 ring-offset-1' : 'opacity-50',
                        isMe ? 'ring-2 ring-blue-500 ring-offset-1 opacity-100' : '',
                      ].join(' ')}
                    >
                      {getInitials(m)}
                    </div>
                  )
                })}
                {members.length > 8 && (
                  <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                    +{members.length - 8}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{votedCount}/{totalMembers} voted</p>
                <p className="text-xs text-slate-500">
                  {totalMembers > 0 ? Math.round((votedCount / totalMembers) * 100) : 0}% participation
                </p>
              </div>
            </div>
            <div className="text-right">
              {group.budget_per_person && (
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Budget/Person</p>
                  <p className="font-bold text-blue-700 text-lg">{formatCurrency(group.budget_per_person)}</p>
                </div>
              )}
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: totalMembers > 0 ? ((votedCount / totalMembers) * 100) + '%' : '0%' }}
            />
          </div>
          {votedCount < totalMembers && (
            <p className="text-xs text-slate-400 mt-2">
              Waiting on {totalMembers - votedCount} more member{totalMembers - votedCount !== 1 ? 's' : ''} to vote.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vote cards */}
          <div className="lg:col-span-2 space-y-4">
            {sortedCandidates.map((dest, rank) => {
              const voteCount = getVoteCount(dest.id)
              const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
              const isMyVote = myVote === dest.id
              const isLeading = rank === 0 && voteCount > 0
              const justVotedThis = justVoted === dest.id

              return (
                <div
                  key={dest.id}
                  className={[
                    'bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all',
                    isMyVote ? 'border-blue-500 shadow-blue-100' : 'border-slate-100 hover:border-slate-200',
                  ].join(' ')}
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="relative w-36 flex-shrink-0">
                      <img
                        src={dest.image_url}
                        alt={dest.name}
                        className="w-full h-full object-cover min-h-[140px]"
                      />
                      {isLeading && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />Leading
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{dest.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{dest.country}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {dest.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(dest.avg_cost_per_day)}</p>
                          <p className="text-xs text-slate-400">per day avg</p>
                        </div>
                      </div>

                      {/* Vote bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={[
                              'h-full rounded-full transition-all duration-700',
                              isMyVote ? 'bg-blue-500' : 'bg-slate-300',
                            ].join(' ')}
                            style={{ width: pct + '%' }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleVote(dest.id)}
                        disabled={voting}
                        className={[
                          'w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                          isMyVote
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700',
                          voting ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                      >
                        {justVotedThis ? (
                          <><CheckCircle className="w-4 h-4" />Voted!</>
                        ) : isMyVote ? (
                          <><CheckCircle className="w-4 h-4" />Your Vote</>
                        ) : (
                          <><ThumbsUp className="w-4 h-4" />Vote for {dest.name}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {candidates.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <p className="text-slate-400">No destinations added yet. The organizer hasn't selected candidates.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Invite card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">Invite Friends</span>
              </div>
              <p className="font-bold text-lg mb-1">Get more votes in!</p>
              <p className="text-blue-100 text-sm mb-4">Share the link with friends so they can join and vote.</p>
              <button
                onClick={copyInviteLink}
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>

            {/* Trip details */}
            {(group.start_date || group.from_city) && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />Trip Details
                </h3>
                <div className="space-y-3">
                  {group.from_city && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Departing from</span>
                      <span className="font-semibold text-slate-900">{group.from_city}</span>
                    </div>
                  )}
                  {group.start_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Departure</span>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Members</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />{totalMembers}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Vote tally */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Live Tally</h3>
              <div className="space-y-3">
                {[...candidates]
                  .sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id))
                  .map((dest, i) => {
                    const count = getVoteCount(dest.id)
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                    return (
                      <div key={dest.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                        <img src={dest.image_url} alt={dest.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{dest.name}</p>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: pct + '%' }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            <Link
              href={'/group/' + id + '/itinerary'}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors"
            >
              View Itinerary
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
