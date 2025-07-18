"use client"

import { Home, FileText, Plus, Settings } from "lucide-react"

interface BottomTabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabs = [
    { id: "today", label: "Today", icon: Home },
    { id: "batches", label: "Batches", icon: FileText },
    { id: "new", label: "New", icon: Plus },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-20">
      <div className="flex items-center justify-between sm:justify-center sm:gap-16 md:gap-24 lg:gap-32 py-2 px-8 sm:px-4 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 sm:px-6 min-w-[64px] sm:min-w-[80px] min-h-[60px] rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="h-5 flex items-center justify-center mb-1">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
