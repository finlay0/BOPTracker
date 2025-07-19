"use client"

import { useEffect, useState } from "react"

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!trigger) return

    setIsActive(true)

    // Apple-inspired color palette
    const colors = [
      "#007AFF", // Apple Blue
      "#34C759", // Apple Green
      "#FF9500", // Apple Orange
      "#FF3B30", // Apple Red
      "#AF52DE", // Apple Purple
      "#5AC8FA", // Apple Light Blue
      "#FFCC00", // Apple Yellow
      "#FF2D92", // Apple Pink
    ]

    // Create particles with Apple-like refinement
    const newParticles: Particle[] = Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2
      const velocity = 80 + Math.random() * 40 // Keep same blast radius

      return {
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3, // Smaller, more refined sizes
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 180, // Reduced rotation speed
        opacity: 1,
      }
    })

    setParticles(newParticles)

    // Clean up after shorter duration
    const timer = setTimeout(() => {
      setIsActive(false)
      setParticles([])
      onComplete?.()
    }, 2000) // Reduced from 4500ms to 2000ms

    return () => clearTimeout(timer)
  }, [trigger, onComplete])

  if (!isActive || particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: "50%",
            top: "50%",
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`, // Reduced glow
            animation: `confetti-${particle.id} 2s ease-out forwards`, // Shorter duration
          }}
        />
      ))}

      {/* Subtle sparkle effect */}
      <div className="absolute inset-0 animate-pulse">
        {Array.from({ length: 3 }).map(
          (
            _,
            i, // Reduced sparkles
          ) => (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: `${45 + Math.random() * 10}%`,
                top: `${45 + Math.random() * 10}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s", // Shorter sparkle duration
              }}
            />
          ),
        )}
      </div>

      <style jsx>{`
        ${particles
          .map(
            (particle) => `
          @keyframes confetti-${particle.id} {
            0% {
              transform: translate(-50%, -50%) rotate(${particle.rotation}deg);
              opacity: 1;
            }
            100% {
              transform: translate(calc(-50% + ${particle.vx}px), calc(-50% + ${particle.vy}px)) rotate(${
                particle.rotation + particle.rotationSpeed * 2
              }deg);
              opacity: 0;
            }
          }
        `,
          )
          .join("")}
      `}</style>
    </div>
  )
}
