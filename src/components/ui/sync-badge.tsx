'use client'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, CloudOff, Check, RefreshCw } from 'lucide-react'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'

type SyncStatus = 'online' | 'offline' | 'queue' | 'synced'

/**
 * Compact status pill that shows current network state + queue depth.
 */
export function SyncBadge({ className, lastSyncedAt }: { className?: string; lastSyncedAt?: string | null }) {
  const online = useApp((s) => s.online)
  const queueCount = useApp((s) => s.queueCount)

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
      <Icon className={cn('h-3.5 w-3.5', status === 'queue' && 'animate-spin')} aria-hidden />
      <span>{label}</span>
      {!online && <WifiOff className="h-3 w-3 opacity-50" aria-hidden />}
    </motion.div>
  )
}
