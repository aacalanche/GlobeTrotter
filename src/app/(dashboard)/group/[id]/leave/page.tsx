'use client'

import nextDynamic from 'next/dynamic'

const LeaveGroupClient = nextDynamic(() => import('./LeaveGroupClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function Page() {
  return <LeaveGroupClient />
}
