'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Check, X, Lightbulb, Calculator, BookOpen, DoorOpen, Sparkles, Star, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import {
  MISSION5_MATH_PROBLEM,
  MISSION5_PASSAGE,
  MISSION5_PASSAGE_QUESTIONS,
} from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Stage = 'doors' | 'blackboard' | 'independent' | 'treasure' | 'done'

/* Fireworks burst */
function Fireworks({ show }: { show: boolean }) {
  const bursts = React.useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 0.5,
        color: ['#18c5d4', '#ffd23f', '#0b1f3a', '#6fe3ee'][i % 4],
        size: 8 + Math.random() * 10,
      })),
    [],
  )
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {bursts.map((b) => (
        <motion.span
          key={b.id}
          initial={{ scale: 0, opacity: 1, x: `${b.x}%`, y: `${b.y}%` }}
          animate={{ scale: [0, 1.4, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 1, delay: b.delay }}
          className="absolute"
          style={{ left: `${b.x}%`, top: `${b.y}%`, color: b.color, fontSize: b.size }}
        >
          ✨
        </motion.span>
      ))}
    </div>
  )
}

/* Treasure chest */
function TreasureChest({
  question,
  index,
  selected,
  revealed,
  onPick,
}: {
  question: typeof MISSION5_PASSAGE_QUESTIONS[number]
  index: number
  selected: number | undefined
  revealed: boolean
  onPick: (idx: number) => void
}) {
  const opened = revealed && selected === question.correctIndex
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border-2 border-navy/20 bg-card p-4 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <motion.span
          animate={opened ? { rotate: [0, -20, 20, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="text-2xl"
          aria-hidden
        >
          {opened ? '💎' : '🪙'}
        </motion.span>
        <p className="text-sm font-semibold text-navy">{index + 1}. {question.question}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt, j) => {
          const sel = selected === j
          const showCorrect = revealed && j === question.correctIndex
          const showWrong = revealed && sel && j !== question.correctIndex
          return (
            <motion.button
              key={j}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={revealed}
              onClick={() => onPick(j)}
              animate={showWrong ? { x: [0, -6, 6, 0] } : {}}
              className={cn(
                'rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all',
                sel && !revealed && 'border-turquoise bg-turquoise/10',
                !sel && !revealed && 'border-border hover:border-turquoise/40',
                showCorrect && 'border-turquoise bg-turquoise text-navy',
                showWrong && 'border-destructive bg-destructive/10',
              )}
            >
              {opt}
              {showCorrect && <Check className="ml-1 inline h-3 w-3" />}
              {showWrong && <X className="ml-1 inline h-3 w-3" />}
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {opened && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-turquoise"
          >
            <Sparkles className="h-3.5 w-3.5" /> Treasure found! {question.explanation}
          </motion.p>
        )}
        {revealed && !opened && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-destructive"
          >
            Not this chest — try again next time. {question.explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function HintGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()

  const [stage, setStage] = React.useState<Stage>('doors')
  const [choice, setChoice] = React.useState<'hint' | 'answer' | null>(null)

  // Blackboard check
  const [blackboardChecked, setBlackboardChecked] = React.useState(false)

  // Independent problem
  const [independentAnswer, setIndependentAnswer] = React.useState('')
  const [independentChecked, setIndependentChecked] = React.useState(false)
  const [independentCorrect, setIndependentCorrect] = React.useState(false)

  // Treasure hunt
  const [passageAnswers, setPassageAnswers] = React.useState<Record<string, number>>({})
  const [revealedChests, setRevealedChests] = React.useState<Set<string>>(new Set())
  const [showFireworks, setShowFireworks] = React.useState(false)

  const recordedRef = React.useRef(false)

  const passageScore = MISSION5_PASSAGE_QUESTIONS.reduce(
    (acc, q) => (passageAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0,
  )

  const chooseDoor = (c: 'hint' | 'answer') => {
    setChoice(c)
    if (c === 'hint') {
      toast.success('Good choice — a hint helps you learn! 💡')
      setTimeout(() => setStage('blackboard'), 600)
    } else {
      toast.error('Copying the answer does not help you learn. Try the hint door! 🚪', { duration: 3000 })
      setTimeout(() => setChoice(null), 600)
    }
  }

  const checkBlackboard = () => {
    setBlackboardChecked(true)
    toast.success('The working is wrong! Tap "Try it yourself".')
  }

  const goIndependent = () => setStage('independent')

  const checkIndependent = () => {
    const val = parseInt(independentAnswer.trim(), 10)
    if (Number.isNaN(val)) {
      toast.error('Type a number first.')
      return
    }
    setIndependentChecked(true)
    if (val === MISSION5_MATH_PROBLEM.independentAnswer) {
      setIndependentCorrect(true)
      setShowFireworks(true)
      toast.success(`You did it! ${MISSION5_MATH_PROBLEM.independentCheck}`)
      setTimeout(() => {
        setShowFireworks(false)
        setStage('treasure')
      }, 2000)
    } else {
      toast.error(`Not quite. ${MISSION5_MATH_PROBLEM.independentCheck}`)
    }
  }

  const pickPassageAnswer = (qId: string, idx: number) => {
    if (revealedChests.has(qId)) return
    setPassageAnswers((a) => ({ ...a, [qId]: idx }))
    const q = MISSION5_PASSAGE_QUESTIONS.find((x) => x.id === qId)
    if (idx === q?.correctIndex) {
      setRevealedChests((prev) => new Set(prev).add(qId))
      toast.success('Treasure found! 🪙')
    } else {
      toast.error('Not that chest — try again!')
    }
  }

  const submitTreasure = () => {
    if (revealedChests.size < MISSION5_PASSAGE_QUESTIONS.length) {
      toast.error('Open every treasure chest first!')
      return
    }
    setStage('done')
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({
        missionId: 'm5',
        activityId: 'game',
        eventType: 'completed',
        score: passageScore,
        maxScore: MISSION5_PASSAGE_QUESTIONS.length,
        payload: { choice, independentAnswer, passageAnswers },
      })
    }
    toast.success(`You found ${passageScore}/${MISSION5_PASSAGE_QUESTIONS.length} treasures!`)
  }

  const next = () => setScreen(nextScreenFor('m5', 'game'))

  return (
    <div className="relative min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m5" step="Hint adventure" />
      <div className="relative mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Fireworks show={showFireworks} />

        {/* Progress */}
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-navy">
          {(['doors', 'blackboard', 'independent', 'treasure'] as Stage[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px]',
                  stage === s
                    ? 'bg-sunshine text-navy'
                    : (['doors', 'blackboard', 'independent', 'treasure'] as Stage[]).indexOf(stage) > i
                      ? 'bg-turquoise text-cream'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {(['doors', 'blackboard', 'independent', 'treasure'] as Stage[]).indexOf(stage) > i ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline capitalize">{s}</span>
              {i < 3 && <span className="h-px w-4 bg-navy/20" />}
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl bg-sunshine/20 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Should AI give you the answer, or help you find it?
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- STAGE 1: DOORS ---------- */}
          {stage === 'doors' && (
            <motion.section
              key="doors"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl bg-card p-5 shadow-sm"
            >
              <h2 className="font-display text-lg text-navy">🚪 Choose your door</h2>
              <p className="text-sm text-navy">
                Math problem on the board: <strong>{MISSION5_MATH_PROBLEM.question}</strong>
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Hint door */}
                <motion.button
                  whileHover={{ scale: 1.04, rotate: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => chooseDoor('hint')}
                  disabled={!!choice}
                  className={cn(
                    'group relative overflow-hidden rounded-3xl border-4 p-6 text-center shadow-md transition-all',
                    choice === 'hint' ? 'border-turquoise bg-turquoise/10' : 'border-turquoise/60 bg-card',
                  )}
                >
                  <motion.span
                    className="text-6xl"
                    animate={choice === 'hint' ? { rotate: [0, -15, 15, 0] } : {}}
                  >
                    💡
                  </motion.span>
                  <p className="mt-2 font-display text-lg text-navy">Give me a hint</p>
                  <p className="text-xs text-muted-foreground">A stepping stone. I&apos;ll try!</p>
                  <DoorOpen className="mx-auto mt-2 h-5 w-5 text-turquoise" />
                </motion.button>

                {/* Answer door */}
                <motion.button
                  whileHover={{ scale: 1.04, rotate: 1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => chooseDoor('answer')}
                  disabled={!!choice}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border-4 p-6 text-center shadow-md transition-all',
                    choice === 'answer' ? 'border-destructive bg-destructive/5' : 'border-destructive/40 bg-card',
                    choice && choice !== 'answer' && 'opacity-60',
                  )}
                >
                  <motion.span
                    className="text-6xl"
                    animate={choice === 'answer' ? { x: [0, -4, 4, 0] } : {}}
                  >
                    🚪
                  </motion.span>
                  <p className="mt-2 font-display text-lg text-navy">Give me the answer</p>
                  <p className="text-xs text-muted-foreground">Just copy it.</p>
                  <X className="mx-auto mt-2 h-5 w-5 text-destructive" />
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* ---------- STAGE 2: BLACKBOARD ---------- */}
          {stage === 'blackboard' && (
            <motion.section
              key="blackboard"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-3xl bg-card p-5 shadow-sm"
            >
              <h2 className="font-display text-lg text-navy">2. Check the blackboard 📋</h2>
              <p className="text-xs text-muted-foreground">
                Someone said this is correct. Tap <strong>Check</strong> to verify the working!
              </p>

              {/* Blackboard */}
              <div className="relative mt-4 overflow-hidden rounded-2xl border-4 border-[#5a3a1a] bg-[#0b1f3a] p-6 text-cream shadow-inner">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, transparent 0, transparent 32px, rgba(255,255,255,0.04) 32px, rgba(255,255,255,0.04) 34px)',
                  }}
                />
                <p className="relative text-center text-lg sm:text-2xl">
                  <span className="opacity-80">{MISSION5_MATH_PROBLEM.wrongExplanation}</span>
                </p>

                {/* Split reveal */}
                <AnimatePresence>
                  {blackboardChecked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="relative mt-4 grid grid-cols-2 gap-2"
                    >
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border-2 border-destructive bg-destructive/15 p-3 text-center"
                      >
                        <p className="text-2xl font-display text-white">3 × 7 = 21</p>
                        <p className="mt-1 text-xs text-destructive">
                          <X className="mr-1 inline h-3 w-3" /> Wrong! 21 ≠ 24
                        </p>
                      </motion.div>
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-xl border-2 border-turquoise bg-turquoise/15 p-3 text-center"
                      >
                        <p className="text-2xl font-display text-cream">3 × 8 = 24</p>
                        <p className="mt-1 text-xs text-turquoise">
                          <Check className="mr-1 inline h-3 w-3" /> Correct!
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {!blackboardChecked ? (
                  <Button variant="sunshine" onClick={checkBlackboard}>
                    <Calculator className="h-4 w-4" /> Check the working
                  </Button>
                ) : (
                  <Button variant="navy" onClick={goIndependent}>
                    Try it myself! <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.section>
          )}

          {/* ---------- STAGE 3: INDEPENDENT ---------- */}
          {stage === 'independent' && (
            <motion.section
              key="independent"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="relative rounded-3xl bg-card p-5 shadow-sm"
            >
              <Fireworks show={showFireworks} />
              <h2 className="font-display text-lg text-navy">3. Try it yourself! ✨</h2>
              <p className="text-sm text-navy">
                Use what you learned. Solve: <strong>{MISSION5_MATH_PROBLEM.independentProblem}</strong>
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="ind">Your answer</Label>
                  <Input
                    id="ind"
                    type="number"
                    inputMode="numeric"
                    value={independentAnswer}
                    onChange={(e) => setIndependentAnswer(e.target.value)}
                    disabled={independentChecked && independentCorrect}
                    className="mt-1"
                  />
                </div>
                {!independentChecked || !independentCorrect ? (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  >
                    <Button variant="turquoise" size="lg" onClick={checkIndependent}>
                      <Check className="h-6 w-6" />
                    </Button>
                  </motion.div>
                ) : (
                  <Badge variant="sunshine" className="text-base">
                    <Star className="mr-1 h-4 w-4 fill-sunshine" /> You did it!
                  </Badge>
                )}
              </div>
              <AnimatePresence>
                {independentChecked && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'mt-3 rounded-xl p-2 text-xs',
                      independentCorrect ? 'bg-turquoise/10 text-turquoise' : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {independentCorrect
                      ? `Correct! ${MISSION5_MATH_PROBLEM.independentCheck}`
                      : `Not quite. ${MISSION5_MATH_PROBLEM.independentCheck} — try again!`}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* ---------- STAGE 4: TREASURE HUNT ---------- */}
          {stage === 'treasure' && (
            <motion.section
              key="treasure"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl bg-card p-5 shadow-sm"
            >
              <h2 className="flex items-center gap-2 font-display text-lg text-navy">
                <KeyRound className="h-4 w-4 text-sunshine" /> 4. Reading treasure hunt
              </h2>
              <p className="text-xs text-muted-foreground">
                Read the scroll. Open every treasure chest by answering correctly!
              </p>

              {/* Passage scroll */}
              <motion.div
                initial={{ rotate: -1, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                className="relative mt-4 rounded-2xl border-2 border-[#5a3a1a] bg-[#fff8e1] p-4 shadow-md"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent 0, transparent 24px, rgba(11,31,58,0.05) 24px, rgba(11,31,58,0.05) 25px)',
                }}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5a3a1a]">
                  <BookOpen className="h-4 w-4" /> The scroll
                </div>
                <p className="text-sm italic text-navy">“{MISSION5_PASSAGE}”</p>
                <motion.span
                  className="absolute -right-2 -top-2 text-2xl"
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  📜
                </motion.span>
              </motion.div>

              <div className="mt-4 space-y-3">
                {MISSION5_PASSAGE_QUESTIONS.map((q, i) => (
                  <TreasureChest
                    key={q.id}
                    question={q}
                    index={i}
                    selected={passageAnswers[q.id]}
                    revealed={revealedChests.has(q.id)}
                    onPick={(idx) => pickPassageAnswer(q.id, idx)}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge variant={revealedChests.size === MISSION5_PASSAGE_QUESTIONS.length ? 'sunshine' : 'secondary'}>
                  {revealedChests.size}/{MISSION5_PASSAGE_QUESTIONS.length} treasures found
                </Badge>
                <Button variant="navy" onClick={submitTreasure} disabled={revealedChests.size < MISSION5_PASSAGE_QUESTIONS.length}>
                  Finish <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}

          {/* ---------- DONE ---------- */}
          {stage === 'done' && (
            <motion.section
              key="done"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-turquoise bg-card p-6 text-center shadow-lg"
            >
              <p className="text-5xl">🏆</p>
              <p className="font-display text-xl text-navy">Adventure complete!</p>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.15, type: 'spring', stiffness: 240 }}
                  >
                    <Star className={cn('h-7 w-7', i < (passageScore === MISSION5_PASSAGE_QUESTIONS.length ? 3 : 2) ? 'fill-sunshine text-sunshine' : 'text-muted-foreground/30')} />
                  </motion.span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                You found <strong className="text-turquoise">{passageScore}/{MISSION5_PASSAGE_QUESTIONS.length}</strong> treasures and solved the math yourself!
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={stage === 'done' ? 'sunshine' : 'secondary'}>
            {stage === 'done' ? 'Game complete!' : 'Hint > Check > Try > Read'}
          </Badge>
          <Button variant="navy" onClick={next} disabled={stage !== 'done'}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
