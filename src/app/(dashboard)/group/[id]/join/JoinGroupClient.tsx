'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, MapPin, CheckCircle, LogIn } from 'lucide-react'

export default function JoinGroupPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoggedIn(false)
        setLoading(false)
        return
      }
      setIsLoggedIn(true)

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_trip_id', id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        setAlreadyMember(true)
        // Already a member - redirect after short delay
        setTimeout(() => router.push('/group/' + id + '/vote'), 1200)
      }
      setLoading(false)
    }
    init()
  }, [id])

  const handleJoin = async () => {
    setJoining(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/group/' + id + '/join')
        return
      }

      const { error: joinError } = await supabase.from('group_members').insert({
        group_trip_id: id,
        user_id: user.id,
        role: 'member',
      })

      if (joinError) {
        if (joinError.code === '23505') {
          // Already a member (unique constraint)
          setAlreadyMember(true)
          setTimeout(() => router.push('/group/' + id + '/vote'), 1000)
        } else {
          throw joinError
        }
      } else {
        setJoined(true)
        setTimeout(() => router.push('/group/' + id + '/vote'), 1500)
      }
    } catch (ex: any) {
      console.error(ex)
      if (ex?.message?.includes('foreign key') || ex?.code === '23503') {
        setError('This group no longer exists.')
      } else {
        setError(ex?.message || 'Could not join the group. Please try again.')
      }
    } finally {
      setJoining(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Header gradient */}
          <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-600 relative flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="p-8 text-center">
            {alreadyMember ? (
              <>
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Already a Member!</h1>
                <p className="text-slate-500 text-sm">Redirecting you to the group vote...</p>
              </>
            ) : joined ? (
              <>
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">You're In!</h1>
                <p className="text-slate-500 text-sm">Taking you to the group vote now...</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">You've Been Invited!</h1>
                <p className="text-slate-500 text-sm mb-6">
                  Join this group trip to vote on destinations and plan together with your friends.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
                  <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Group Trip</p>
                    <p className="text-xs text-blue-700">Vote on destinations, plan the itinerary, and more.</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {isLoggedIn ? (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    {joining ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</>
                    ) : (
                      <><Users className="w-4 h-4" />Join Group Trip</>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">You need to be signed in to join.</p>
                    <button
                      onClick={() => router.push('/login?redirect=/group/' + id + '/join')}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <LogIn className="w-4 h-4" />Sign In to Join
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
