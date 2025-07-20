"use client"

import type React from "react"

import { ArrowLeft, Wine } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UserGuide() {
  const router = useRouter()

  const Section = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <Card className="p-6 bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      {children}
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <Wine className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              BOP Tracker – User Guide
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your winery’s daily assistant for tracking wine-kit batches.
            </p>
          </div>
        </div>

        {/* Welcome blurb */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 mb-8">
          <p className="text-purple-800 dark:text-purple-300 text-lg">
            This guide walks you through everything you need to know, step-by-step.
          </p>
        </Card>

        {/* Sections */}
        <div className="space-y-8">
          <Section title="1️⃣ Logging In">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Use your email and password to log in to your winery’s private dashboard.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              If you forget your password, contact your administrator or use the reset option.
            </p>
          </Section>

          <Section title="2️⃣ Adding Your First Batch">
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
              <li>Go to the “New” tab at the bottom.</li>
              <li>Fill in the form: Customer Name, Wine Kit, Kit Duration, Date of Sale.</li>
              <li>
                Tell the system if the kit is already put up:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>✅ Yes → today’s date is used.</li>
                  <li>❌ No → choose a future Put-Up date.</li>
                </ul>
              </li>
            </ol>
            <p className="text-gray-700 dark:text-gray-300">
              Racking, Filtering and Bottling dates are calculated automatically. Tap “Save Batch” when done.
            </p>
          </Section>

          <Section title="3️⃣ Viewing and Completing Today’s Tasks">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Today page groups tasks by type (Bottle, Filter, Rack, Overdue, Future). Tap “Mark as Done” to
              complete a task — when all are finished you’ll see a short celebration 🎉.
            </p>
          </Section>

          <Section title="4️⃣ Navigating Between Days">
            <p className="text-gray-700 dark:text-gray-300">
              Use the arrows at the top of Today to browse dates. You can mark tasks as done for today or any past day.
              Tap “Back to Today” to return.
            </p>
          </Section>

          <Section title="5️⃣ Viewing All Batches">
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Search, filter by kit duration or status, and sort results.</li>
              <li>Edit customer, kit or status straight from the list.</li>
              <li>Tap a BOP # to open full batch details.</li>
            </ul>
          </Section>

          <Section title="6️⃣ Batch Detail View">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              See complete schedule, notes and status. You can override any date — the Today page updates automatically.
            </p>
          </Section>

          <Section title="7️⃣ Settings & Support">
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Change your password</li>
              <li>Toggle light/dark mode</li>
              <li>Open this user guide</li>
              <li>Send a message to support</li>
            </ul>
          </Section>

          <Card className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">🧠 Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-400">
              <li>You don’t need to delete batches — just mark them complete.</li>
              <li>Use notes for customer-specific requests.</li>
              <li>Overdue tasks stay visible until completed.</li>
              <li>You can reschedule any dates in Batch Detail.</li>
            </ul>
          </Card>

          <Card className="p-6 text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
              Thanks for using BOP Tracker — built for wineries like yours.
            </p>
            <p className="text-blue-700 dark:text-blue-400">
              Need help? Go to&nbsp;Settings → Message Support any time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
