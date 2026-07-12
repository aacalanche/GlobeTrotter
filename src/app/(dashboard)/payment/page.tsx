'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard, Lock, CheckCircle, ArrowLeft, Plane, Train,
  Bus, Car, Shield, Zap, ChevronDown, AlertCircle, Loader2
} from 'lucide-react'

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
}
function formatCVV(val: string) {
  return val.replace(/\D/g, '').slice(0, 4)
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

const CARD_NETWORKS: Record<string, string> = {
  '4': 'Visa', '5': 'Mastercard', '3': 'Amex', '6': 'Discover',
}
function detectNetwork(num: string) {
  return CARD_NETWORKS[num[0]] || ''
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  train:  <Train className="w-4 h-4" />,
  bus:    <Bus   className="w-4 h-4" />,
  car:    <Car   className="w-4 h-4" />,
}

function PaymentPageInner() {
  const router = useRouter()
  const sp = useSearchParams()

  // Read trip details from query params
  const amount    = parseFloat(sp.get('amount') || '0')
  const tripTitle = sp.get('trip')    || 'Your Trip'
  const fromCity  = sp.get('from')    || 'Origin'
  const toCity    = sp.get('to')      || 'Destination'
  const tripDate  = sp.get('date')    || ''
  const mode      = sp.get('mode')    || 'flight'
  const travelers = parseInt(sp.get('travelers') || '1')
  const tripId    = sp.get('tripId')  || ''
  const operator  = sp.get('operator')|| ''

  // Form state
  const [payMethod, setPayMethod] = useState<'card' | 'apple' | 'google'>('card')
  const [cardNum, setCardNum]     = useState('')
  const [cardName, setCardName]   = useState('')
  const [expiry, setExpiry]       = useState('')
  const [cvv, setCvv]             = useState('')
  const [zip, setZip]             = useState('')
  const [saveCard, setSaveCard]   = useState(false)

  // Billing address
  const [showBilling, setShowBilling] = useState(false)
  const [address, setAddress]   = useState('')
  const [city, setCity]         = useState('')
  const [state, setState]       = useState('')

  // UX state
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const network = detectNetwork(cardNum.replace(/\s/g, ''))
  const serviceFee = Math.round(amount * 0.035)
  const taxes      = Math.round(amount * 0.08)
  const total      = amount + serviceFee + taxes

  function validate() {
    const e: Record<string, string> = {}
    if (payMethod === 'card') {
      if (cardNum.replace(/\s/g, '').length < 16) e.cardNum  = 'Enter a valid 16-digit card number'
      if (!cardName.trim())                         e.cardName = 'Name on card is required'
      if (expiry.length < 5)                        e.expiry   = 'Enter expiry as MM/YY'
      if (cvv.length < 3)                           e.cvv      = 'Enter 3-4 digit CVV'
      if (zip.length < 5)                           e.zip      = 'Enter a valid ZIP code'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePay = async () => {
    if (!validate()) return
    setProcessing(true)
    // Simulate payment processing (2s)
    await new Promise(r => setTimeout(r, 2000))
    setProcessing(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 text-sm mb-1">
            Your {mode} from <strong>{fromCity}</strong> to <strong>{toCity}</strong> is booked.
          </p>
          <p className="text-slate-400 text-xs mb-6">A confirmation email has been sent to your account.</p>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Booking ref</span>
              <span className="font-mono font-bold text-slate-800">GT-{Math.random().toString(36).toUpperCase().slice(2, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount paid</span>
              <span className="font-bold text-emerald-600">{formatCurrency(total)}</span>
            </div>
            {operator && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Operator</span>
                <span className="font-semibold text-slate-700">{operator}</span>
              </div>
            )}
            {tripDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-700">{tripDate}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {tripId && (
              <Link href={`/trips/${tripId}`}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm">
                View Trip Plan
              </Link>
            )}
            <Link href="/trips"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm">
              Go to My Trips
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <Lock className="w-4 h-4 text-emerald-500" />
            Secure Checkout
          </div>
          <div className="text-xs text-slate-400 font-medium">SSL Encrypted</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Demo checkout — do not enter real card details</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This is a portfolio demo. No payment is processed and no data is stored or sent anywhere. Use placeholder values (e.g. 4242 4242 4242 4242).
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT — Payment Form */}
        <div className="lg:col-span-3 space-y-6">

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Payment Method</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {([
                { id: 'card',   label: 'Credit / Debit', icon: '💳' },
                { id: 'apple',  label: 'Apple Pay',       icon: '🍎' },
                { id: 'google', label: 'Google Pay',      icon: '🔵' },
              ] as const).map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ' +
                    (payMethod === m.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300')
                  }>
                  <span className="text-xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {payMethod === 'card' && (
              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNum}
                      onChange={e => setCardNum(formatCardNumber(e.target.value))}
                      className={
                        'w-full px-4 py-3 border-2 rounded-xl text-sm font-mono text-slate-900 outline-none transition-colors ' +
                        (errors.cardNum ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500')
                      }
                    />
                    {network && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {network}
                      </span>
                    )}
                  </div>
                  {errors.cardNum && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cardNum}</p>}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Name on Card</label>
                  <input
                    type="text"
                    placeholder="Full name as on card"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className={
                      'w-full px-4 py-3 border-2 rounded-xl text-sm text-slate-900 outline-none transition-colors ' +
                      (errors.cardName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500')
                    }
                  />
                  {errors.cardName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cardName}</p>}
                </div>

                {/* Expiry + CVV + ZIP */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Expiry</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      className={
                        'w-full px-4 py-3 border-2 rounded-xl text-sm font-mono text-slate-900 outline-none transition-colors ' +
                        (errors.expiry ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500')
                      }
                    />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">CVV</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="•••"
                      value={cvv}
                      onChange={e => setCvv(formatCVV(e.target.value))}
                      className={
                        'w-full px-4 py-3 border-2 rounded-xl text-sm font-mono text-slate-900 outline-none transition-colors ' +
                        (errors.cvv ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500')
                      }
                    />
                    {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">ZIP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="12345"
                      value={zip}
                      onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className={
                        'w-full px-4 py-3 border-2 rounded-xl text-sm font-mono text-slate-900 outline-none transition-colors ' +
                        (errors.zip ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500')
                      }
                    />
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                </div>

                {/* Save card */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-slate-600">Save this card for future bookings</span>
                </label>

                {/* Billing Address (collapsible) */}
                <button
                  onClick={() => setShowBilling(v => !v)}
                  className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                  <ChevronDown className={`w-4 h-4 transition-transform ${showBilling ? 'rotate-180' : ''}`} />
                  {showBilling ? 'Hide' : 'Add'} Billing Address
                </button>
                {showBilling && (
                  <div className="space-y-3 pt-1">
                    <input type="text" placeholder="Street address" value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm text-slate-900 outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="City" value={city}
                        onChange={e => setCity(e.target.value)}
                        className="px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm text-slate-900 outline-none" />
                      <input type="text" placeholder="State" value={state}
                        onChange={e => setState(e.target.value)}
                        className="px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm text-slate-900 outline-none" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {(payMethod === 'apple' || payMethod === 'google') && (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <p className="text-4xl mb-3">{payMethod === 'apple' ? '🍎' : '🔵'}</p>
                <p className="text-slate-700 font-bold text-sm mb-1">
                  {payMethod === 'apple' ? 'Apple Pay' : 'Google Pay'}
                </p>
                <p className="text-slate-400 text-xs">
                  You'll be redirected to complete payment securely.
                </p>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { icon: <Lock className="w-4 h-4 text-emerald-500" />, label: 'SSL Secure' },
              { icon: <Shield className="w-4 h-4 text-blue-500" />, label: 'PCI Compliant' },
              { icon: <Zap className="w-4 h-4 text-amber-500" />, label: 'Instant Confirmation' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                {b.icon}{b.label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Order Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-slate-900 text-lg mb-5">Order Summary</h2>

            {/* Trip Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 mb-5 text-white">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-2 capitalize">
                {MODE_ICONS[mode] || <Plane className="w-4 h-4" />}
                {mode} Booking
              </div>
              <p className="font-bold text-base truncate">{tripTitle}</p>
              <p className="text-blue-200 text-sm mt-0.5">{fromCity} → {toCity}</p>
              {tripDate && <p className="text-blue-200 text-xs mt-1">{tripDate}</p>}
              {operator && <p className="text-blue-100 text-xs mt-0.5">{operator}</p>}
              <p className="text-blue-200 text-xs mt-1">{travelers} {travelers === 1 ? 'traveler' : 'travelers'}</p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Base fare × {travelers}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service fee (3.5%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & fees (8%)</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between font-bold text-slate-900 text-base">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none text-sm">
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                : <><Lock className="w-4 h-4" />Pay {formatCurrency(total)}</>
              }
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">
              This is a demo — no real charge will occur.
            </p>

            {/* Cancellation Policy */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 font-semibold mb-1">Cancellation Policy</p>
              <p className="text-xs text-amber-700">Free cancellation within 24 hours. After that, a 15% fee applies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <PaymentPageInner />
    </Suspense>
  )
}
