'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Mascot } from '@/components/ui/mascot'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function SignInScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const setLearner = useApp((s) => s.setLearner)
  const setState = useApp((s) => s.setState)

  const [code, setCode] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const valid = code.trim().length >= 3 && pin.length === 4

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!valid || loading) return
    setLoading(true)
    try {
      const res = await api<{
        learner: any
      }>('/api/auth/login', {
        method: 'POST',
        json: { learnerCode: code.trim(), pin },
      })
      // Use the login response as the source of truth.
      setLearner(res.learner)
      // Try to also load state (non-blocking).
      try {
        const me = await api<{ state?: any }>('/api/auth/me')
        if (me.state) setState(me.state)
      } catch {
        // ignore — login is enough
      }
      // Newly created learners have avatar-1 already. Always route to avatar-select
      // so they can pick their own (skip is fine if they just want the default).
      setScreen('avatar-select')
      toast.success(`Welcome, ${res.learner.nickname}!`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not sign in. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-turquoise text-navy">
      <div className="pointer-events-none absolute inset-0 bg-adventure-grid opacity-30" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <button
          onClick={() => setScreen('welcome')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy/70 hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-cream p-6 shadow-xl sm:p-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <Mascot size={56} float={false} />
            <div>
              <h1 className="font-display text-2xl">Sign in, explorer</h1>
              <p className="text-sm text-muted-foreground">Enter your code and 4-digit PIN.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Your learner code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX-AB12"
                autoCapitalize="characters"
                autoComplete="off"
                className="font-mono text-lg uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin">Your 4-digit PIN</Label>
              <InputOTP maxLength={4} value={pin} onChange={(v) => setPin(v)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">
                Ask your tutor if you forgot your PIN.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="navy"
              className="w-full"
              disabled={!valid || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Start my adventure <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        <p className="mt-6 text-center text-xs text-navy/70">
          No account yet? Ask your tutor to set one up.
        </p>
      </div>
    </div>
  )
}
