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
      }, 4500) // Extended to 4.5 seconds

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!isActive) return null

  // Generate particles for burst effect
  const particles = Array.from({ length: 25 }).map((_, i) => {
    const angle = (i / 25) * 360
    const velocity = 80 + Math.random() * 60 // Smaller radius for screen bounds
    const size = Math.random() > 0.7 ? "large" : "small"
    const shape = Math.random() > 0.5 ? "circle" : "square"
    const color = [
      "#FF6B6B", // coral
      "#4ECDC4", // teal
      "#45B7D1", // blue
      "#96CEB4", // mint
      "#FFEAA7", // yellow
      "#DDA0DD", // plum
      "#98D8C8", // seafoam
      "#F7DC6F", // gold
    ][Math.floor(Math.random() * 8)]

    return {
      id: i,
      angle,
      velocity,
      size,
      shape,
      color,
      delay: Math.random() * 0.2,
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
            className={`${particle.size === "large" ? "w-3 h-3" : "w-2 h-2"} ${
              particle.shape === "circle" ? "rounded-full" : "rounded-sm"
            } opacity-90`}
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 6px ${particle.color}40`,
            }}
          />
        </div>
      ))}

      {/* Add some sparkle effects */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-sparkle"
          style={{
            left: `${-5 + Math.random() * 10}px`,
            top: `${-5 + Math.random() * 10}px`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        >
          <div className="w-1 h-1 bg-white rounded-full opacity-80" />
        </div>
      ))}
    </>
  )
}
