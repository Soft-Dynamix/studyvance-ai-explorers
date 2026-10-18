'use client'
import * as React from 'react'
import { HelpCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const HELP_CATEGORIES = [
  { id: 'stuck', label: 'I am stuck on what to do', emoji: '🧭' },
  { id: 'tech', label: 'The app or audio is not working', emoji: '🛠️' },
  { id: 'scared', label: 'I feel worried or unsure', emoji: '💜' },
  { id: 'other', label: 'Something else', emoji: '✨' },
] as const

type HelpButtonProps = {
  className?: string
  missionId?: string
}

export function HelpButton({ className, missionId }: HelpButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState<string>('stuck')
  const [note, setNote] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const learner = useApp((s) => s.learner)

  async function submit() {
    if (!learner) return
    setSending(true)
    try {
      await api('/api/help', {
        method: 'POST',
        json: {
          missionId: missionId ?? 'general',
          category,
          note: note.trim() || undefined,
        },
      })
      toast.success('Your tutor has been pinged. Take a deep breath — help is on the way.')
      setOpen(false)
      setNote('')
      setCategory('stuck')
    } catch {
      toast.error('Could not send help request. Please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sunshine text-navy shadow-lg ring-4 ring-sunshine/30 focus:outline-none focus:ring-4 focus:ring-turquoise',
            className
          )}
          aria-label="Ask for help"
        >
          <HelpCircle className="h-7 w-7" />
          <span className="sr-only">Ask for help</span>
          <AnimatePresence>
            <motion.span
              key="ping"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-sunshine"
            />
          </AnimatePresence>
        </motion.button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-sunshine" /> Ask for help
          </DialogTitle>
          <DialogDescription>
            Pick what is happening. Your tutor will be quietly pinged.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <RadioGroup value={category} onValueChange={setCategory} className="grid gap-2">
            {HELP_CATEGORIES.map((c) => (
              <label
                key={c.id}
                htmlFor={`help-cat-${c.id}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border px-3 py-2.5 text-sm font-medium transition-all hover:border-turquoise',
                  category === c.id && 'border-turquoise bg-turquoise/10'
                )}
              >
                <RadioGroupItem value={c.id} id={`help-cat-${c.id}`} className="sr-only" />
                <span className="text-xl" aria-hidden>{c.emoji}</span>
                <span className="flex-1">{c.label}</span>
                {category === c.id && <span className="h-2 w-2 rounded-full bg-turquoise" />}
              </label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="help-note">Anything else? (optional)</Label>
            <Textarea
              id="help-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell your tutor a bit more…"
              rows={3}
              maxLength={300}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="sunshine" onClick={submit} disabled={sending || !learner}>
            <Send className="h-4 w-4" /> Send to tutor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
