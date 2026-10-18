'use client'
import * as React from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, CloudOff, Check, RefreshCw } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getQueuedEvents, clearQueuedEvents, isOnline } from '@/lib/offline'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type SyncStatus = 'online' | 'offline' | 'queue' | 'synced'

/**
 * Compact status pill that shows current network state + queue depth.
 * Includes a "Sync now" button when there are queued events.
 */
export function SyncBadge({ className, lastSyncedAt }: { className?: string; lastSyncedAt?: string | null }) {
  const online = useApp((s) => s.online)
  const queueCount = useApp((s) => s.queueCount)
  const refreshQueueCount = useApp((s) => s.refreshQueueCount)
  const setState = useApp((s) => s.setState)
  const [syncing, setSyncing] = React.useState(false)

  let status: SyncStatus = 'online'
  let label = 'Online'
  let Icon = Wifi
  if (!online) {
    status = 'offline'
    label = 'Offline'
    Icon = CloudOff
  } else if (queueCount > 0) {
    status = 'queue'
    label = `${queueCount} queued`
    Icon = RefreshCw
  } else if (lastSyncedAt) {
    status = 'synced'
    label = 'Synced'
    Icon = Check
  }

  // Auto-sync when online and queue has items
  React.useEffect(() => {
    if (!isOnline() || queueCount === 0 || syncing) return
    // Auto-sync after 2 seconds
    const timer = setTimeout(() => {
      void doSync()
    }, 2000)
    return () => clearTimeout(timer)
  }, [queueCount, online]) // eslint-disable-line react-hooks/exhaustive-deps

  const doSync = async () => {
    if (!isOnline()) return
    const queued = getQueuedEvents()
    if (queued.length === 0) return
    setSyncing(true)
    try {
      const res = await api<{ accepted?: string[]; skipped?: string[]; state?: any }>(
        '/api/progress',
        { method: 'POST', json: { events: queued } }
      )
      if (res?.accepted) {
        clearQueuedEvents(res.accepted)
      }
      if (res?.skipped) {
        clearQueuedEvents(res.skipped)
      }
      refreshQueueCount()
      if (res?.state) setState(res.state)
    } catch (err: any) {
      // If 401 (not signed in), clear the queue — these events can't be synced
      if (err?.status === 401 || err?.message?.includes('Not signed in')) {
        clearQueuedEvents(queued.map(e => e.eventId))
        refreshQueueCount()
        toast.info('Please sign in again to sync progress.')
      }
      // Otherwise keep the queue for retry
    } finally {
      setSyncing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm',
        status === 'online' && 'border-turquoise/30 bg-turquoise/10 text-navy',
        status === 'offline' && 'border-destructive/30 bg-destructive/10 text-destructive',
        status === 'queue' && 'border-sunshine/40 bg-sunshine/15 text-navy',
        status === 'synced' && 'border-turquoise/30 bg-turquoise/10 text-navy',
        className
      )}
      title={lastSyncedAt ? `Last sync: ${new Date(lastSyncedAt).toLocaleString()}` : label}
      aria-live="polite"
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'queue' && !syncing && 'animate-pulse', syncing && 'animate-spin')} aria-hidden />
      <span>{syncing ? 'Syncing...' : label}</span>
      {!online && <WifiOff className="h-3 w-3 opacity-50" aria-hidden />}
      {status === 'queue' && !syncing && online && (
        <button
          onClick={() => void doSync()}
          className="ml-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-cream hover:bg-navy-soft"
          aria-label="Sync now"
        >
          Sync now
        </button>
      )}
    </motion.div>
  )
}
