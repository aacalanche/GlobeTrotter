'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ArrowLeft, LogOut, Users, MessageSquare, Map } from 'lucide-react'

export default function LeaveGroupPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState('this group')

  useEffect(() => {
    const loadGroup = async () => {
      const { data } = await supabase
        .from('group_trips')
        .select('name')
        .eq('id', id)
        .single()
      if (data?.name) setGroupName(data.name)
    }
    loadGroup()
  }, [id])

  const handleLeave = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase
        .from('group_members')
        .delete()
        .eq('group_trip_id', id)
        .eq('user_id', user.id)

      router.push('/home')
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleStay = () => {
    router.back()
  }

  const LOSING = [
    { icon: MessageSquare, label: 'Group chat & updates', color: 'text-blue-500' },
    { icon: Map, label: 'Shared itineraries & plans', color: 'text-purple-500' },
    { icon: Users, label: 'Group voting access', color: 'text-emerald-500' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Top image area */}
        <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-20 h-20 rounded-full bg-white" />
            <div className="absolute -top-4 right-8 w-32 h-32 rounded-full bg-blue-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="p-7">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Leave Group Trip?
          </h2>
          <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
            You're about to leave <strong className="text-slate-900">{groupName}</strong>. Your spot will be freed up for someone else.
          </p>

          {/* What you lose */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">You'll lose access to</p>
            <div className="space-y-2.5">
              {LOSING.map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Re-join note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
            <p className="text-xs text-amber-800">
              You can rejoin later if the organizer sends you a new invite.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleLeave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Yes, Leave Group
                </>
              )}
            </button>

            <button
              onClick={handleStay}
              disabled={loading}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors text-sm"
            >
              No, Stay in Group
            </button>
          </div>

          <button
            onClick={handleStay}
            className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mt-4 w-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
