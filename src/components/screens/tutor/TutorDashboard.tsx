'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  Lock,
  Unlock,
  Users,
  Trophy,
  Download,
  HelpCircle,
  CloudDownload,
  CheckCircle2,
  Plus,
  KeyRound,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mascot } from '@/components/ui/mascot'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { prepareOffline, getOfflinePreparedAt } from '@/lib/offline'

type Cohort = { id: string; name: string; gradeBand: string; learnerCount?: number }
type Learner = {
  id: string
  learnerCode: string
  nickname: string
  grade: string
  avatarId: string
  active: boolean
  cohort: { id: string; name: string; gradeBand: string } | null
  state: {
    missions: Record<string, any>
    badges: string[]
    lastSyncAt: string | null
    contentVersion: string
  } | null
  helpFlagCount?: number
  projectCount?: number
  eventCount?: number
  createdAt: string
}
type HelpFlag = {
  id: string
  learnerId: string
  missionId: string
  category: string
  note: string | null
  createdAt: string
  resolvedAt: string | null
  learner: { id: string; nickname: string; learnerCode: string; cohort: string } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  stuck: '🧭 Stuck',
  tech: '🛠️ Tech issue',
  scared: '💜 Worried',
  other: '✨ Other',
}

export function TutorDashboard() {
  const setScreen = useApp((s) => s.setScreen)
  const [tutor, setTutor] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  // Login form
  const [username, setUsername] = React.useState('tutor')
  const [pin, setPin] = React.useState('')
  const [loginLoading, setLoginLoading] = React.useState(false)

  // Setup
  const [setupLoading, setSetupLoading] = React.useState(false)
  const [setupResult, setSetupResult] = React.useState<any>(null)

  // Data
  const [cohorts, setCohorts] = React.useState<Cohort[]>([])
  const [learners, setLearners] = React.useState<Learner[]>([])
  const [helpFlags, setHelpFlags] = React.useState<HelpFlag[]>([])
  const [filterCohort, setFilterCohort] = React.useState<string>('')

  // New learner form
  const [newNickname, setNewNickname] = React.useState('')
  const [newCohortId, setNewCohortId] = React.useState('')
  const [newLearnerResult, setNewLearnerResult] = React.useState<any>(null)
  const [creating, setCreating] = React.useState(false)

  // Offline prep
  const [offlinePrep, setOfflinePrep] = React.useState<{ cached: number; failed: number; bytes: number } | null>(null)
  const [offlinePrepAt, setOfflinePrepAt] = React.useState<string | null>(null)
  const [preparing, setPreparing] = React.useState(false)

  // New cohort form
  const [newCohortName, setNewCohortName] = React.useState('')
  const [newCohortGrade, setNewCohortGrade] = React.useState('')
  const [creatingCohort, setCreatingCohort] = React.useState(false)

  const refreshAll = React.useCallback(async () => {
    const [c, l, h] = await Promise.all([
      api<{ cohorts: Cohort[] }>('/api/tutor/cohorts'),
      api<{ learners: Learner[] }>(`/api/tutor/learners${filterCohort ? `?cohortId=${filterCohort}` : ''}`),
      api<{ flags: HelpFlag[] }>('/api/tutor/help-flags'),
    ])
    setCohorts(c.cohorts)
    setLearners(l.learners)
    setHelpFlags(h.flags)
    setOfflinePrepAt(getOfflinePreparedAt())
  }, [filterCohort])

  // Auto-resume tutor session on mount
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await api<{ tutor: any }>('/api/tutor/me')
        if (cancelled) return
        if (me.tutor) {
          setTutor(me.tutor)
          await refreshAll()
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshAll])

  const login = async () => {
    if (!username || pin.length !== 4) return
    setLoginLoading(true)
    try {
      const res = await api<{ tutor: any }>('/api/tutor/login', {
        method: 'POST',
        json: { username, pin },
      })
      setTutor(res.tutor)
      toast.success('Welcome, tutor!')
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api('/api/tutor/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setTutor(null)
    setScreen('welcome')
  }

  const runSetup = async () => {
    setSetupLoading(true)
    try {
      const res = await api<any>('/api/setup', { method: 'POST' })
      setSetupResult(res)
      if (res.alreadyConfigured) {
        toast.info('Already configured. Use the existing tutor PIN.')
      } else {
        toast.success('Setup complete! Save your PINs now.')
      }
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Setup failed')
    } finally {
      setSetupLoading(false)
    }
  }

  const createLearner = async () => {
    if (!newNickname || !newCohortId) return
    setCreating(true)
    try {
      const res = await api<{ learner: any; pin: string }>('/api/tutor/learners', {
        method: 'POST',
        json: { nickname: newNickname, cohortId: newCohortId, grade: 'Grade 5' },
      })
      setNewLearnerResult(res)
      setNewNickname('')
      toast.success('Learner created. Save the PIN!')
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create learner')
    } finally {
      setCreating(false)
    }
  }

  const createCohort = async () => {
    if (!newCohortName || !newCohortGrade) return
    setCreatingCohort(true)
    try {
      await api('/api/tutor/cohorts', {
        method: 'POST',
        json: { name: newCohortName, gradeBand: newCohortGrade },
      })
      setNewCohortName('')
      setNewCohortGrade('')
      toast.success('Cohort created!')
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create cohort')
    } finally {
      setCreatingCohort(false)
    }
  }

  const resetPin = async (learnerId: string) => {
    try {
      const res = await api<{ pin: string; learnerCode: string }>('/api/tutor/pin-reset', {
        method: 'POST',
        json: { learnerId },
      })
      toast.success(`New PIN for ${res.learnerCode}: ${res.pin}`, { duration: 8000 })
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not reset PIN')
    }
  }

  const deleteLearner = async (learnerId: string, nickname: string) => {
    if (!confirm(`Permanently delete ${nickname}? This cannot be undone.`)) return
    try {
      await api(`/api/tutor/learners/${learnerId}?mode=deactivate`, { method: 'DELETE' })
      toast.success(`${nickname} deactivated.`)
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not delete')
    }
  }

  const resolveFlag = async (id: string) => {
    try {
      await api(`/api/tutor/help-flags/${id}/resolve`, { method: 'POST' })
      toast.success('Flag marked as resolved.')
      await refreshAll()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not resolve')
    }
  }

  const exportCsv = async () => {
    try {
      const res = await fetch(`/api/tutor/export${filterCohort ? `?cohortId=${filterCohort}` : ''}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'studyvance-learners.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV downloaded.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Export failed')
    }
  }

  const prepareOfflineAssets = async () => {
    setPreparing(true)
    try {
      const manifest = await api<{ assets: string[] }>('/api/curriculum')
      const urls = manifest.assets ?? []
      const res = await prepareOffline(urls)
      setOfflinePrep(res)
      setOfflinePrepAt(getOfflinePreparedAt())
      toast.success(`Cached ${res.cached} assets (${(res.bytes / 1024 / 1024).toFixed(1)} MB).`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Offline prep failed')
    } finally {
      setPreparing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-turquoise" />
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-navy text-cream">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-50" aria-hidden />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
          <button
            onClick={() => setScreen('welcome')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-cream/70 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" /> Back to welcome
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-cream p-6 text-navy shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <Mascot size={56} float={false} />
              <div>
                <h1 className="font-display text-2xl">Tutor / Admin</h1>
                <p className="text-sm text-muted-foreground">Sign in with your tutor PIN.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tpin">4-digit PIN</Label>
                <InputOTP maxLength={4} value={pin} onChange={(v) => setPin(v)}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                variant="sunshine"
                onClick={login}
                disabled={!username || pin.length !== 4 || loginLoading}
              >
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                Sign in
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                First time?
              </p>
              <Button variant="outline" onClick={runSetup} disabled={setupLoading} className="w-full">
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Run one-time setup
              </Button>
              {setupResult && !setupResult.alreadyConfigured && (
                <div className="mt-3 rounded-xl bg-sunshine/20 p-3 text-sm">
                  <p className="font-semibold">Save these PINs (shown once):</p>
                  <pre className="mt-2 overflow-x-auto text-xs">
{JSON.stringify(setupResult, null, 2)}
                  </pre>
                </div>
              )}
              {setupResult?.alreadyConfigured && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Already configured. Use your existing tutor PIN.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 bg-navy text-cream shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('welcome')}
              className="rounded-full p-1.5 text-cream/80 hover:bg-cream/10"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg sm:text-xl">Tutor dashboard</h1>
            <Badge variant="sunshine" className="ml-2">
              {tutor.role === 'admin' ? 'Admin' : 'Tutor'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-cream hover:bg-cream/10" onClick={exportCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="ghost" className="text-cream hover:bg-cream/10" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="learners">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 overflow-x-auto">
            <TabsTrigger value="learners" className="gap-1">
              <Users className="h-4 w-4" /> Learners
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1">
              <Trophy className="h-4 w-4" /> Progress
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-1">
              <CloudDownload className="h-4 w-4" /> Offline prep
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-1">
              <HelpCircle className="h-4 w-4" /> Help flags
              {helpFlags.filter((f) => !f.resolvedAt).length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {helpFlags.filter((f) => !f.resolvedAt).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Learners tab */}
          <TabsContent value="learners" className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Label htmlFor="filter-cohort">Filter by cohort</Label>
                <select
                  id="filter-cohort"
                  value={filterCohort}
                  onChange={(e) => setFilterCohort(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-input px-3 text-base"
                >
                  <option value="">All cohorts</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={refreshAll}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>

            <ScrollArea className="h-[60vh] rounded-2xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nickname</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Missions</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners.map((l) => {
                    const missionsCompleted = Object.values(l.state?.missions ?? {}).filter(
                      (m: any) => m?.status === 'completed'
                    ).length
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs font-bold">{l.learnerCode}</TableCell>
                        <TableCell className="font-semibold">{l.nickname}</TableCell>
                        <TableCell className="text-xs">{l.cohort?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={missionsCompleted === 6 ? 'sunshine' : 'secondary'}>
                            {missionsCompleted}/6
                          </Badge>
                        </TableCell>
                        <TableCell>{l.state?.badges?.length ?? 0}</TableCell>
                        <TableCell>
                          {l.active ? (
                            <Badge variant="turquoise">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => resetPin(l.id)}
                              title="Reset PIN"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteLearner(l.id, l.nickname)}
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {learners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No learners yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Create learner */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="flex items-center gap-2 font-display text-base">
                <Plus className="h-4 w-4 text-turquoise" /> Add a learner
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="nn">Nickname</Label>
                  <Input
                    id="nn"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Sam"
                  />
                </div>
                <div>
                  <Label htmlFor="nc">Cohort</Label>
                  <select
                    id="nc"
                    value={newCohortId}
                    onChange={(e) => setNewCohortId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-input px-3 text-base"
                  >
                    <option value="">Select…</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="navy"
                    onClick={createLearner}
                    disabled={!newNickname || !newCohortId || creating}
                    className="w-full"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create
                  </Button>
                </div>
              </div>
              {newLearnerResult && (
                <div className="mt-3 rounded-xl bg-sunshine/20 p-3 text-sm">
                  <p className="font-semibold">
                    Created {newLearnerResult.learner.nickname} ({newLearnerResult.learner.learnerCode})
                  </p>
                  <p className="mt-1 text-xs">
                    PIN (shown once): <span className="font-mono font-bold">{newLearnerResult.pin}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewLearnerResult(null)}
                    className="mt-2"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>

            {/* Create cohort */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="flex items-center gap-2 font-display text-base">
                <Plus className="h-4 w-4 text-turquoise" /> Add a cohort
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="cn">Name</Label>
                  <Input
                    id="cn"
                    value={newCohortName}
                    onChange={(e) => setNewCohortName(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Grade 6 — Class B"
                  />
                </div>
                <div>
                  <Label htmlFor="cg">Grade band</Label>
                  <Input
                    id="cg"
                    value={newCohortGrade}
                    onChange={(e) => setNewCohortGrade(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Grade 6"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={createCohort}
                    disabled={!newCohortName || !newCohortGrade || creatingCohort}
                    className="w-full"
                  >
                    {creatingCohort ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create cohort
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Progress tab */}
          <TabsContent value="progress" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Learners</p>
                <p className="font-display text-3xl text-navy">{learners.length}</p>
              </div>
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Missions completed</p>
                <p className="font-display text-3xl text-turquoise">
                  {learners.reduce(
                    (acc, l) =>
                      acc +
                      Object.values(l.state?.missions ?? {}).filter((m: any) => m?.status === 'completed').length,
                    0
                  )}
                </p>
              </div>
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Badges earned</p>
                <p className="font-display text-3xl text-sunshine">
                  {learners.reduce((acc, l) => acc + (l.state?.badges?.length ?? 0), 0)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="font-display text-base">Mission completion by learner</h3>
              <ScrollArea className="h-[50vh] mt-3">
                <div className="space-y-2">
                  {learners.map((l) => {
                    const missions = l.state?.missions ?? {}
                    const completedSet = new Set(
                      Object.entries(missions)
                        .filter(([, v]: any) => v?.status === 'completed')
                        .map(([k]) => k)
                    )
                    return (
                      <div key={l.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{l.nickname}</p>
                            <p className="font-mono text-xs text-muted-foreground">{l.learnerCode}</p>
                          </div>
                          <div className="flex gap-1">
                            {['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((m) => (
                              <span
                                key={m}
                                title={m}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold',
                                  completedSet.has(m) ? 'bg-sunshine text-navy' : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {m.replace('m', '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Offline prep tab */}
          <TabsContent value="offline" className="space-y-4">
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-base">
                <CloudDownload className="h-4 w-4 text-turquoise" /> Prepare this device for offline use
              </h3>
              <p className="text-sm text-muted-foreground">
                Caches illustrations, audio, avatars and badges to this browser so learners can keep
                playing when the internet drops.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="sunshine" onClick={prepareOfflineAssets} disabled={preparing}>
                  {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                  Cache assets
                </Button>
                {offlinePrepAt && (
                  <Badge variant="turquoise">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Last prepared: {new Date(offlinePrepAt).toLocaleString()}
                  </Badge>
                )}
              </div>
              {offlinePrep && (
                <div className="mt-3 rounded-xl bg-turquoise/10 p-3 text-sm">
                  <p>
                    Cached <strong>{offlinePrep.cached}</strong> assets ·{' '}
                    Failed <strong>{offlinePrep.failed}</strong> ·{' '}
                    Size <strong>{(offlinePrep.bytes / 1024 / 1024).toFixed(1)} MB</strong>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Help flags tab */}
          <TabsContent value="help" className="space-y-4">
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-base">
                <HelpCircle className="h-4 w-4 text-sunshine" /> Help flags
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time pings from learners who are stuck or worried.
              </p>
              <ScrollArea className="h-[60vh] mt-3">
                <div className="space-y-2">
                  {helpFlags.map((f) => (
                    <div
                      key={f.id}
                      className={cn(
                        'rounded-xl border p-3',
                        f.resolvedAt ? 'border-border bg-muted/50 opacity-70' : 'border-sunshine bg-sunshine/10'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {f.learner?.nickname ?? 'Learner'}{' '}
                            <span className="font-mono text-xs text-muted-foreground">
                              ({f.learner?.learnerCode ?? '—'})
                            </span>
                          </p>
                          <p className="text-xs">
                            {CATEGORY_LABELS[f.category] ?? f.category} ·{' '}
                            <span className="text-muted-foreground">
                              {new Date(f.createdAt).toLocaleString()}
                            </span>
                          </p>
                          {f.note && (
                            <p className="mt-1 text-xs text-navy">“{f.note}”</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mission: {f.missionId}
                          </p>
                        </div>
                        {!f.resolvedAt ? (
                          <Button size="sm" variant="navy" onClick={() => resolveFlag(f.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                          </Button>
                        ) : (
                          <Badge variant="turquoise">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {helpFlags.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 text-turquoise" />
                      <p>No help flags yet. Explorers are doing well!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
