"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsActive(true)
      const timer = setTimeout(() => {
        setIsActive(false)
        onComplete?.()
      }, 2000) // Reduced from 4.5s to 2s for shorter duration

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!isActive) return null

  // Generate fewer particles for more subtle effect (Apple-like)
  const particles = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i / 16) * 360
    const velocity = 80 + Math.random() * 60 // Keep same blast radius
    const size = Math.random() > 0.8 ? "large" : "small" // Fewer large particles
    const shape = "circle" // Apple prefers circles over squares
    // Apple-inspired color palette - more refined and subtle
    const color = [
      "#007AFF", // Apple blue
      "#34C759", // Apple green
      "#FF9500", // Apple orange
      "#FF3B30", // Apple red
      "#AF52DE", // Apple purple
      "#5AC8FA", // Apple light blue
      "#FFCC00", // Apple yellow
      "#FF2D92", // Apple pink
    ][Math.floor(Math.random() * 8)]

    return {
      id: i,
      angle,
      velocity,
      size,
      shape,
      color,
      delay: Math.random() * 0.1, // Reduced delay for tighter timing
    }
  })

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-burst"
          style={
            {
              "--angle": `${particle.angle}deg`,
              "--velocity": `${particle.velocity}px`,
              "--delay": `${particle.delay}s`,
              animationDelay: `${particle.delay}s`,
            } as React.CSSProperties
          }
        >
          <div
            className={`${particle.size === "large" ? "w-2.5 h-2.5" : "w-1.5 h-1.5"} rounded-full opacity-80`}
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 4px ${particle.color}30`, // Softer glow
            }}
          />
        </div>
      ))}

      {/* Reduced sparkle effects for subtlety */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-sparkle"
          style={{
            left: `${-3 + Math.random() * 6}px`,
            top: `${-3 + Math.random() * 6}px`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        >
          <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60" />
        </div>
      ))}
    </>
  )
}
