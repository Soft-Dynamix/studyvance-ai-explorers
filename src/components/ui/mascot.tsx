'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type MascotProps = {
  size?: number
  message?: string
  float?: boolean
  className?: string
  imageSrc?: string
}

const DEFAULT_MASCOT = '/assets/mascot/vance-robot.png'

/**
 * Vance robot mascot with optional speech bubble + float animation.
 */
export function Mascot({ size = 96, message, float = true, className, imageSrc }: MascotProps) {
  const src = imageSrc || DEFAULT_MASCOT
  return (
    <div className={cn('flex items-end gap-3', className)}>
      <motion.div
        animate={float ? { y: [0, -6, 0] } : undefined}
        transition={float ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
        className="relative shrink-0 rounded-full bg-turquoise/10 p-1.5 ring-2 ring-turquoise/30"
        style={{ width: size + 12, height: size + 12 }}
      >
        <Image
          src={src}
          alt="Vance, the friendly robot guide"
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={(e) => {
            // Hide broken image; show fallback emoji behind it via parent bg
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
          }}
        />
        <div className="pointer-events-none absolute inset-1.5 flex items-center justify-center rounded-full bg-turquoise/10 text-4xl">
          🤖
        </div>
      </motion.div>
      {message ? (
        <div className="relative mb-2 max-w-xs rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-2 text-sm font-medium text-navy shadow-sm">
          <span className="sr-only">Vance says:</span>
          {message}
        </div>
      ) : null}
    </div>
  )
}
