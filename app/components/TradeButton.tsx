// app/components/TradeButton.tsx
'use client'

import { motion } from 'framer-motion'
import cn from 'classnames'
import { useState } from 'react'

type Props = {
  label: string
  kind: 'buy' | 'sell'
  onClick: () => Promise<void> | void
  disabled?: boolean
}

export default function TradeButton({ label, kind, onClick, disabled }: Props) {
  const [pulse, setPulse] = useState(false)

  async function handleClick() {
    if (disabled) return
    try {
      await onClick()
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    } catch {
      // swallow; parent shows message
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full rounded-xl2 py-3 text-center font-semibold transition-colors',
        'border',
        kind === 'buy'
          ? 'bg-okx-buy/90 hover:bg-okx-buy text-black border-okx-buy/40'
          : 'bg-okx-sell/90 hover:bg-okx-sell text-black border-okx-sell/40',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span className="relative inline-block">
        {label}
        {pulse && (
          <motion.span
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              'absolute inset-0 rounded-full -z-10',
              kind === 'buy' ? 'bg-okx-buy' : 'bg-okx-sell'
            )}
            style={{ filter: 'blur(10px)' }}
          />
        )}
      </span>
    </motion.button>
  )
}
