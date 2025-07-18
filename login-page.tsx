"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to main app
    window.location.href = "/"

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to BOP Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to manage your wine batches</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter your password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
