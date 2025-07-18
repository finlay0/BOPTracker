"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Check, X } from "lucide-react"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [shopCode, setShopCode] = useState("")

  // Password strength validation
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const canSubmitSignUp = email && password && isPasswordValid && shopCode

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      if (canSubmitSignUp) {
        console.log("Sign up:", { email, password, shopCode })
      }
    } else {
      console.log("Sign in:", { email, password })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to BOP Tracker
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isSignUp ? "Create your account to get started" : "Sign in or create your account to manage wine batches"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {isSignUp && password && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries({
                      length: "At least 8 characters",
                      uppercase: "One uppercase letter",
                      lowercase: "One lowercase letter",
                      number: "One number",
                      special: "One special character",
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            passwordRequirements[key as keyof typeof passwordRequirements]
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="shopCode">Shop Code</Label>
                <Input
                  id="shopCode"
                  type="text"
                  placeholder="Enter your shop code"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Contact your administrator for your shop code</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200"
              disabled={isSignUp && !canSubmitSignUp}
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setPassword("")
                setEmail("")
                setShopCode("")
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
