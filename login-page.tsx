"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Check, X } from "lucide-react"

interface PasswordRequirement {
  text: string
  met: boolean
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accessCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
      { text: "At least 8 characters", met: password.length >= 8 },
      { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { text: "Contains number", met: /\d/.test(password) },
      { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]
  }

  const passwordRequirements = getPasswordRequirements(formData.password)
  const isPasswordStrong = passwordRequirements.every((req) => req.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isSignUp) {
      // Validate access code (you can customize this validation)
      if (!formData.accessCode.trim()) {
        alert("Access code is required")
        setIsLoading(false)
        return
      }

      if (!isPasswordStrong) {
        alert("Please ensure your password meets all requirements")
        setIsLoading(false)
        return
      }

      // Simulate sign up
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert("Account created successfully! Please sign in.")
      setIsSignUp(false)
      setFormData({ email: formData.email, password: "", accessCode: "" })
    } else {
      // Simulate login
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Redirect to main app
      window.location.href = "/"
    }

    setIsLoading(false)
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setFormData({ email: "", password: "", accessCode: "" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSignUp ? "Join BOP Tracker to manage your wine batches" : "Sign in to manage your wine batches"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Email Address
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

          {isSignUp && (
            <div>
              <label htmlFor="accessCode" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Access Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accessCode"
                value={formData.accessCode}
                onChange={(e) => handleInputChange("accessCode", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter your access code"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Contact your administrator for an access code
              </p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isSignUp && formData.password && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Password Requirements</h4>
              <div className="space-y-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {req.met ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                    <span
                      className={`text-xs ${req.met ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                    >
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || (isSignUp && !isPasswordStrong)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isSignUp ? "Creating Account..." : "Signing In...") : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={toggleMode}
            className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
