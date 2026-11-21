import * as React from 'react'
import { cn } from '@/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card text-card-foreground',
        className,
      )}
      {...props}
    />
  )
}
