'use client'

import React from 'react'

export function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className={`animate-in fade-in duration-300 fill-mode-both ${className}`}
    >
      {children}
    </div>
  )
}

export function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className={`animate-in zoom-in-95 duration-300 fill-mode-both ${className}`}
    >
      {children}
    </div>
  )
}

export function SlideIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  from?: 'bottom' | 'top' | 'left' | 'right'
  delay?: number
  className?: string
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both ${className}`}
    >
      {children}
    </div>
  )
}

export function Stagger({
  children,
  className = '',
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`animate-in fade-in duration-300 ${className}`}>{children}</div>
}

export function HoverLift({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export function PressScale({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`transition-transform duration-100 active:scale-98 ${className}`}>
      {children}
    </div>
  )
}

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}
