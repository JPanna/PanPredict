'use client'
import React from 'react'

type Props = {
  label: string
  kind: 'buy' | 'sell' | 'create'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function TradeButton({
  label,
  kind,
  onClick,
  disabled,
  className,
}: Props) {
  const tone =
    kind === 'buy' ? 'btn-buy' : kind === 'sell' ? 'btn-sell' : 'btn-create'
  const classes = `btn ${tone}${className ? ` ${className}` : ''}`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {label}
    </button>
  )
}
