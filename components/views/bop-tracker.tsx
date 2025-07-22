"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BottomTabBar } from "./components/bottom-tab-bar"
import { useTheme } from "./components/theme-provider"
import { Confetti } from "./components/confetti"
import { useRouter } from "next/navigation"
import { ToastContainer, useToast } from "./components/toast"
import { PasswordChangeModal } from "./components/password-change-modal"
import BatchDetail from "./batch-detail"
import { supabase } from "@/utils/supabase/client"
import { getBatchesForDate, generateTasksFromBatches, getAllBatches, updateBatchStatus, createBatch, updateBatchStageStatus, updateUserDarkMode } from "@/lib/batch-utils"

// Remove static tasksData - will be loaded from backend

interface Task {
  id: string // Changed from number to string for batch IDs
  type: string
  action: string
  bopNumber: string
  wineKit: string
  customer: string
  completed: boolean
  batchId: string
  stage: string
}

// Sample batch data - will be replaced with real data
const batchesData = [
  {
    id: 1,
    bopNumber: "#1042",
    customer: "Taylor",
    wineKit: "Cabernet Sauvignon",
    kitWeeks: 6,
    putUp: "2024-06-15",
    rack: "2024-06-29",
    filter: "2024-07-13",
    bottle: "2024-07-27",
    status: "pending",
    currentStage: "filter",
  },
  {
    id: 2,
    bopNumber: "#1038",
    customer: "Johnson",
    wineKit: "Pinot Grigio",
    kitWeeks: 4,
    putUp: "2024-06-20",
    rack: "2024-07-04",
    filter: "2024-07-11",
    bottle: "2024-07-18",
    status: "done",
    currentStage: "completed",
  },
  {
    id: 3,
    bopNumber: "#1035",
    customer: "Williams",
    wineKit: "Chardonnay",
    kitWeeks: 5,
    putUp: "2024-06-10",
    rack: "2024-06-24",
    filter: "2024-07-08",
    bottle: "2024-07-22",
    status: "pending",
    currentStage: "bottle",
  },
  {
    id: 4,
    bopNumber: "#1041",
    customer: "Brown",
    wineKit: "Merlot",
    kitWeeks: 8,
    putUp: "2024-05-15",
    rack: "2024-06-12",
    filter: "2024-07-10",
    bottle: "2024-08-07",
    status: "pending",
    currentStage: "rack",
  },
  {
    id: 5,
    bopNumber: "#1029",
    customer: "Davis",
    wineKit: "Sauvignon Blanc",
    kitWeeks: 4,
    putUp: "2024-06-25",
    rack: "2024-07-09",
    filter: "2024-07-16",
    bottle: "2024-07-23",
    status: "done",
    currentStage: "completed",
  },
  {
    id: 6,
    bopNumber: "#1045",
    customer: "Miller",
    wineKit: "Riesling",
    kitWeeks: 6,
    putUp: "2024-06-18",
    rack: "2024-07-02",
    filter: "2024-07-16",
    bottle: "2024-07-30",
    status: "pending",
    currentStage: "put-up",
  },
]

function BatchesView({ 
  setActiveTab, 
  wineryId, 
  showSuccess, 
  showError 
}: { 
  setActiveTab: (tab: string) => void 
  wineryId: string | null
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [weekFilter, setWeekFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("bottling-soonest")
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [showBatchDetail, setShowBatchDetail] = useState(false)
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Load batches from backend
  useEffect(() => {
    const loadBatches = async () => {
      if (!wineryId) return

      try {
        setLoading(true)
        const batchData = await getAllBatches(wineryId)
        setBatches(batchData)
      } catch (error) {
        console.error('Error loading batches:', error)
        showError('Load Error', 'Failed to load batch data')
      } finally {
        setLoading(false)
      }
    }

    loadBatches()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadBatches, 30000)
    
    return () => clearInterval(interval)
  }, [wineryId, showError])

  // Add this function to handle batch row clicks:
  const handleBatchClick = (batchId: string) => {
    setSelectedBatchId(batchId)
    setShowBatchDetail(true)
  }

  // Add this function to handle going back from detail view:
  const handleBackFromDetail = () => {
    setShowBatchDetail(false)
    setSelectedBatchId(null)
  }

  // Add conditional rendering at the start of the return statement:
  if (showBatchDetail && selectedBatchId) {
    return <BatchDetail batchId={selectedBatchId} onBack={handleBackFromDetail} />
  }

  // Show loading state
  if (loading) {
    return (
      <div className="pt-16 lg:pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading batches...</p>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced filter and sort logic
  const filteredAndSortedBatches = batches
    .filter((batch) => {
      // Search filter
      const matchesSearch =
        batch.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#${batch.bop_number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.wine_kit.toLowerCase().includes(searchTerm.toLowerCase())

      // Week filter
      const matchesWeekFilter = weekFilter === "all" || batch.kit_weeks.toString() === weekFilter

      // Status filter
      let matchesStatusFilter = true
      if (statusFilter === "in-progress") {
        matchesStatusFilter = batch.status === "pending"
      } else if (statusFilter === "completed") {
        matchesStatusFilter = batch.status === "done"
      } else if (statusFilter === "overdue") {
        // Check if any stage is overdue
        const today = new Date().toISOString().split('T')[0]
        matchesStatusFilter = batch.status === "pending" && (
          batch.put_up_date < today ||
          batch.rack_date < today ||
          batch.filter_date < today ||
          batch.bottle_date < today
        )
      }

      return matchesSearch && matchesWeekFilter && matchesStatusFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "bottling-soonest":
          return new Date(a.bottle_date).getTime() - new Date(b.bottle_date).getTime()
        case "customer-az":
          return a.customer.localeCompare(b.customer)
        case "bop-newest":
          return b.bop_number - a.bop_number
        default:
          return 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    return status === "done"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  }

  const getStageProgress = (batch: any) => {
    let completed = 0
    const total = 4
    
    if (batch.put_up_completed) completed++
    if (batch.rack_completed) completed++
    if (batch.filter_completed) completed++
    if (batch.bottle_completed) completed++
    
    return (completed / total) * 100
  }

  const getCurrentStageLabel = (batch: any) => {
    if (batch.status === 'done') return 'completed'
    if (!batch.put_up_completed) return 'put-up'
    if (!batch.rack_completed) return 'rack'
    if (!batch.filter_completed) return 'filter'
    if (!batch.bottle_completed) return 'bottle'
    return 'completed'
  }

  return (
    <div className="pt-16 lg:pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar - Always Visible */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer, BOP #, or wine kit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters & Sort
            </span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Mobile Collapsible Filters */}
        {showFilters && (
          <div className="mb-4 lg:hidden">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kit Duration
                  </label>
                  <select
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Weeks</option>
                    <option value="4">4 Week Kits</option>
                    <option value="5">5 Week Kits</option>
                    <option value="6">6 Week Kits</option>
                    <option value="8">8 Week Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="bottling-soonest">Bottling Date (soonest first)</option>
                    <option value="customer-az">Customer Name (A–Z)</option>
                    <option value="bop-newest">Recently Added (Newest BOP #)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filters - Always Visible */}
        <div className="hidden lg:block mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kit Duration</label>
              <select
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Weeks</option>
                <option value="4">4 Week Kits</option>
                <option value="5">5 Week Kits</option>
                <option value="6">6 Week Kits</option>
                <option value="8">8 Week Kits</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="bottling-soonest">Bottling Date (soonest first)</option>
                <option value="customer-az">Customer Name (A–Z)</option>
                <option value="bop-newest">Recently Added (Newest BOP #)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count with Info Icon */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAndSortedBatches.length} of {batches.length} batches
          </p>
          {/* Info Icon with Tooltip */}
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
              Click any row to view full batch details or make edits.
            </div>
          </div>
        </div>

        {/* Mobile: Card Layout */}
        <div className="block lg:hidden space-y-4">
          {filteredAndSortedBatches.map((batch) => (
            <Card
              key={batch.id}
              onClick={() => handleBatchClick(batch.id)}
              className="p-4 bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] dark:shadow-gray-900/20"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                      #{batch.bop_number}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(batch.status)}`}>
                      {batch.status === "done" ? "Complete" : "In Progress"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {batch.kit_weeks}w kit
                  </span>
                </div>

                {/* Customer & Wine Kit */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{batch.customer}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{batch.wine_kit}</p>
                </div>

                {/* Progress Bar */}
                {batch.status === "pending" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Progress</span>
                      <span className="capitalize">{getCurrentStageLabel(batch).replace("-", " ")}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getStageProgress(batch)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Put-Up</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(batch.put_up_date)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Rack</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(batch.rack_date)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Filter</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(batch.filter_date)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Bottle</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(batch.bottle_date)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BOP #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wine Kit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Put-Up
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rack
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Filter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bottle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAndSortedBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    onClick={() => handleBatchClick(batch.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                        #{batch.bop_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{batch.customer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{batch.wine_kit}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{batch.kit_weeks} week kit</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(batch.put_up_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(batch.rack_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(batch.filter_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(batch.bottle_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}
                      >
                        {batch.status === "done" ? "Complete" : "In Progress"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Empty State */}
        {filteredAndSortedBatches.length === 0 && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 lg:py-24">
            <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center">
              <svg
                className="w-10 h-10 lg:w-12 lg:h-12 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl lg:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
              No batches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
              Create your first batch to get started tracking your wine production.
            </p>
            <button
              onClick={() => setActiveTab("new")}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Batch
            </button>
          </div>
        )}

        {/* Search Results Empty State */}
        {filteredAndSortedBatches.length === 0 && batches.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 lg:py-24">
            <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
              No batches match your filters
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Try adjusting your search terms or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function NewBatchView({ 
  wineryId, 
  userProfile, 
  showSuccess, 
  showError 
}: {
  wineryId: string | null
  userProfile: any
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
}) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "", // Optional field
    wineKitName: "",
    kitDuration: "6",
    dateOfSale: "",
    putUpStatus: "no", // "yes" or "no"
    scheduledPutUpDate: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const calculateDates = () => {
    const { dateOfSale, putUpStatus, scheduledPutUpDate, kitDuration } = formData

    if (!dateOfSale) return null

    let putUpDate: Date

    if (putUpStatus === "yes") {
      // If already put up, use today's date
      putUpDate = new Date()
    } else {
      // If not put up yet, use scheduled date or date of sale
      putUpDate = new Date(scheduledPutUpDate || dateOfSale)
    }

    // Calculate subsequent dates
    const rackingDate = new Date(putUpDate)
    rackingDate.setDate(rackingDate.getDate() + 14) // 2 weeks

    const filteringDate = new Date(rackingDate)
    const weeksToAdd = Number.parseInt(kitDuration) - 2
    filteringDate.setDate(filteringDate.getDate() + weeksToAdd * 7)

    const bottlingDate = new Date(filteringDate)
    bottlingDate.setDate(bottlingDate.getDate() + 14) // 2 weeks

    // Adjust if bottling falls on Sunday (day 0)
    if (bottlingDate.getDay() === 0) {
      bottlingDate.setDate(bottlingDate.getDate() + 1) // Move to Monday
    }

    return {
      putUp: putUpDate,
      racking: rackingDate,
      filtering: filteringDate,
      bottling: bottlingDate,
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required"
    }

    if (!formData.wineKitName.trim()) {
      newErrors.wineKitName = "Wine kit name is required"
    }

    if (!formData.dateOfSale) {
      newErrors.dateOfSale = "Date of sale is required"
    }

    if (formData.putUpStatus === "no" && !formData.scheduledPutUpDate) {
      newErrors.scheduledPutUpDate = "Scheduled put-up date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!wineryId || !userProfile) {
      showError("Error", "User information not available")
      return
    }

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const calculatedDates = calculateDates()
      if (!calculatedDates) {
        showError("Error", "Unable to calculate batch dates")
        return
      }

      // Create batch data for backend
      const batchData = {
        winery_id: wineryId,
        customer: formData.customerName,
        customer_email: formData.customerEmail.trim() || null,
        wine_kit: formData.wineKitName,
        kit_weeks: parseInt(formData.kitDuration) as 4 | 5 | 6 | 8,
        date_of_sale: formData.dateOfSale,
        put_up_date: calculatedDates.putUp.toISOString().split('T')[0],
        created_by: userProfile.id
      }

      // Create batch in backend
      const newBatch = await createBatch(batchData)

      showSuccess("Batch Created", `Batch #${newBatch.bop_number} has been created successfully for ${formData.customerName}!`)

      // Reset form
      setFormData({
        customerName: "",
        customerEmail: "",
        wineKitName: "",
        kitDuration: "6",
        dateOfSale: "",
        putUpStatus: "no",
        scheduledPutUpDate: "",
      })
      
    } catch (error) {
      console.error('Error creating batch:', error)
      showError("Save Failed", "Failed to create batch. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const calculatedDates = calculateDates()

  return (
    <div className="pt-16 lg:pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="space-y-6">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.customerName
                    ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                    : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="Enter customer name"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customerName}</p>
              )}
            </div>

            {/* Customer Email (Optional) */}
            <div>
              <label
                htmlFor="customerEmail"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
              >
                Customer Email (Optional)
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter customer email"
              />
            </div>

            {/* Wine Kit Name */}
            <div>
              <label htmlFor="wineKitName" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Wine Kit Name
              </label>
              <input
                type="text"
                id="wineKitName"
                value={formData.wineKitName}
                onChange={(e) => handleInputChange("wineKitName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.wineKitName
                    ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                    : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="e.g., Cabernet Sauvignon"
              />
              {errors.wineKitName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.wineKitName}</p>
              )}
            </div>

            {/* Kit Duration */}
            <div>
              <label htmlFor="kitDuration" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Kit Duration
              </label>
              <select
                id="kitDuration"
                value={formData.kitDuration}
                onChange={(e) => handleInputChange("kitDuration", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="4">4 weeks</option>
                <option value="5">5 weeks</option>
                <option value="6">6 weeks</option>
                <option value="8">8 weeks</option>
              </select>
            </div>

            {/* Date of Sale */}
            <div>
              <label htmlFor="dateOfSale" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Date of Sale
              </label>
              <input
                type="date"
                id="dateOfSale"
                value={formData.dateOfSale}
                onChange={(e) => handleInputChange("dateOfSale", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.dateOfSale
                    ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                    : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
                } text-gray-900 dark:text-gray-100`}
              />
              {errors.dateOfSale && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateOfSale}</p>}
            </div>

            {/* Put-Up Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Has this kit already been put up?
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="putUpStatus"
                    value="yes"
                    checked={formData.putUpStatus === "yes"}
                    onChange={(e) => handleInputChange("putUpStatus", e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                    Yes, it's already been put up (will use today's date)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="putUpStatus"
                    value="no"
                    checked={formData.putUpStatus === "no"}
                    onChange={(e) => handleInputChange("putUpStatus", e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">No, schedule it for later</span>
                </label>
              </div>
            </div>

            {/* Scheduled Put-Up Date - only show if "No" is selected */}
            {formData.putUpStatus === "no" && (
              <div>
                <label
                  htmlFor="scheduledPutUpDate"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                >
                  Schedule Put-Up Date
                </label>
                <input
                  type="date"
                  id="scheduledPutUpDate"
                  value={formData.scheduledPutUpDate}
                  onChange={(e) => handleInputChange("scheduledPutUpDate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose when you plan to put up this batch
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Section */}
        {calculatedDates && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Batch Timeline Preview</h3>

            <div className="space-y-4">
              {/* Timeline Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Put-Up</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(calculatedDates.putUp)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Racking</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(calculatedDates.racking)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Filtering</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(calculatedDates.filtering)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Bottling</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(calculatedDates.bottling)}
                      {calculatedDates.bottling.getDay() === 1 &&
                        new Date(calculatedDates.filtering.getTime() + 14 * 24 * 60 * 60 * 1000).getDay() === 0 && (
                          <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                            Moved from Sunday
                          </span>
                        )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Duration</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.kitDuration} weeks</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Ready Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDateShort(calculatedDates.bottling)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Batch...</span>
                </div>
              ) : (
                "Create Batch"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsView({ 
  wineryAccessCode, 
  userProfile, 
  showSuccess, 
  showError 
}: { 
  wineryAccessCode: string
  userProfile: any
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  // Email change state
  const [newEmail, setNewEmail] = useState("")
  const [isEmailChangeLoading, setIsEmailChangeLoading] = useState(false)

  // Support form state
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
  })
  const [isSupportLoading, setIsSupportLoading] = useState(false)
  const [supportSent, setSupportSent] = useState(false)

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handlePasswordChangeSuccess = () => {
    showSuccess("Password Updated", "Your password has been changed successfully.")
  }

  const handlePasswordChangeError = (message: string) => {
    showError("Password Change Failed", message)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      // Real logout with Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        showError("Logout Failed", "Failed to log out. Please try again.")
        return
      }

      showSuccess("Logged Out", "You have been successfully logged out.")
      setShowLogoutConfirm(false)
      
      // Redirect to login page
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error) {
      console.error('Logout error:', error)
      showError("Logout Failed", "Something went wrong during logout")
    }
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const toggleDarkMode = async () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    
    try {
      // Update dark mode in database using client-side call
      const { error } = await supabase
        .from('user_profiles')
        .update({ dark_mode: newTheme === "dark" })
        .eq('id', userProfile.id)
      
      if (error) {
        console.error('Error updating dark mode:', error)
        showError("Theme Update Failed", "Failed to save theme preference")
        // Revert theme on error
        setTheme(theme)
        return
      }
      
      showSuccess("Theme Updated", `Switched to ${newTheme} mode`)
    } catch (error) {
      console.error('Error updating dark mode:', error)
      showError("Theme Update Failed", "Failed to save theme preference")
      // Revert theme on error
      setTheme(theme)
    }
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      showError("Invalid Email", "Please enter a valid email address")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      showError("Invalid Email", "Please enter a valid email address")
      return
    }

    // Check if email is different from current
    if (newEmail === userProfile.email) {
      showError("Same Email", "Please enter a different email address")
      return
    }

    setIsEmailChangeLoading(true)
    try {
      // Real email change with Supabase
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        console.error('Email change error:', error)
        showError("Email Change Failed", error.message)
        return
      }

      showSuccess("Email Update Requested", "Please check your new email for confirmation")
      setNewEmail("")
    } catch (error) {
      console.error('Email change error:', error)
      showError("Email Change Failed", "Something went wrong")
    } finally {
      setIsEmailChangeLoading(false)
    }
  }

  const handleSupportSubmit = async () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      showError("Invalid Form", "Please fill in all fields")
      return
    }

    setIsSupportLoading(true)
    try {
      // Real support message storage to Supabase
      const { error } = await supabase
        .from('support_messages')
        .insert({
          winery_id: userProfile.winery_id,
          user_id: userProfile.id,
          subject: supportForm.subject,
          message: supportForm.message,
          status: 'open',
          priority: 'medium'
        })

      if (error) {
        console.error('Support message error:', error)
        showError("Send Failed", "Failed to send support message")
        return
      }
      
      showSuccess("Message Sent", "Your support message has been sent successfully")
      setSupportForm({ subject: "", message: "" })
      setSupportSent(true)
      
      // Reset sent state after 3 seconds
      setTimeout(() => setSupportSent(false), 3000)
    } catch (error) {
      console.error('Support submit error:', error)
      showError("Send Failed", "Failed to send support message")
    } finally {
      setIsSupportLoading(false)
    }
  }

  const handleSupportInputChange = (field: string, value: string) => {
    setSupportForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        onError={handlePasswordChangeError}
      />
      {/* Rest of the existing SettingsView JSX... */}

      <div className="pt-16 lg:pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account</h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Current Email Display */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email Change Section */}
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="newEmail"
                      className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                    >
                      Change Email
                    </label>
                    <input
                      type="email"
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Enter new email"
                    />
                  </div>

                  <button
                    onClick={handleEmailChange}
                    disabled={isEmailChangeLoading || !newEmail.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isEmailChangeLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Change Link"
                    )}
                  </button>
                </div>
              </div>

              {/* Winery Access Code */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Winery Access Code</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{wineryAccessCode}</p>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="px-6 py-4">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-600"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Change Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your account password</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* App Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">App Preferences</h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Dark Mode Toggle */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Switch to dark theme</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                      theme === "dark" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        theme === "dark" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Support</h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* User Guide Button */}
              <div className="px-6 py-4">
                <button
                  onClick={() => router.push("/user-guide")}
                  className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-600"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Open User Guide</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Learn how to use BOP Tracker</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>

              {/* Message Support Form */}
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Message Support</h3>

                    {/* Subject Line (Optional) */}
                    <div className="mb-4">
                      <label
                        htmlFor="supportSubject"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                      >
                        Subject (Optional)
                      </label>
                      <input
                        type="text"
                        id="supportSubject"
                        value={supportForm.subject}
                        onChange={(e) => handleSupportInputChange("subject", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Brief description of your issue"
                        disabled={isSupportLoading}
                      />
                    </div>

                    {/* Message Text Area */}
                    <div className="mb-4">
                      <label
                        htmlFor="supportMessage"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                      >
                        How can we help?
                      </label>
                      <textarea
                        id="supportMessage"
                        value={supportForm.message}
                        onChange={(e) => handleSupportInputChange("message", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                        placeholder="Describe your question or issue in detail..."
                        disabled={isSupportLoading}
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSupportSubmit}
                      disabled={isSupportLoading || !supportForm.message.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {isSupportLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        "Send Message"
                      )}
                    </button>

                    {/* Confirmation Message */}
                    {supportSent && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm font-medium text-green-800 dark:text-green-400">
                            Message sent successfully!
                          </p>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          We'll get back to you within 24 hours.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* App Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h2>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Version */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Version</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">BOP Tracker v1.0.0</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="px-6 py-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  Log Out
                </button>
              </div>

              {/* Logout Confirmation Modal */}
              {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Log Out</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Are you sure you want to log out of your account?
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={cancelLogout}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmLogout}
                        className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function generateAccessCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

export default function BOPTracker() {
  // Add toast hook at the top of the component
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const { theme, setTheme } = useTheme()

  // Authentication and user state
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [wineryId, setWineryId] = useState<string | null>(null)
  const [wineryName, setWineryName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // App state
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState("today")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevCompletedCount, setPrevCompletedCount] = useState(0)
  const progressCircleRef = useRef<HTMLDivElement>(null)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user data and authentication state
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Get user profile with winery information
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            wineries (
              id,
              name,
              join_code
            )
          `)
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error loading user profile:', profileError)
          showError('Profile Error', 'Failed to load user profile')
          return
        }

        if (!profile?.winery_id) {
          // User hasn't joined a winery yet, redirect to join flow
          router.push('/login')
          return
        }

        setUserProfile(profile)
        setWineryId(profile.winery_id)
        setWineryName(profile.wineries?.name || 'Your Winery')
        
      } catch (error) {
        console.error('Error loading user data:', error)
        showError('Load Error', 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, showError])

  // Initialize theme from user profile
  useEffect(() => {
    if (mounted && userProfile?.dark_mode !== undefined) {
      setTheme(userProfile.dark_mode ? 'dark' : 'light')
    }
  }, [mounted, userProfile, setTheme])

  // Load tasks for the selected date with real-time updates
  useEffect(() => {
    const loadTasks = async () => {
      if (!wineryId) return

      try {
        // Get batches for the selected date
        const batches = await getBatchesForDate(wineryId, selectedDate)
        
        // Generate tasks from batches
        const generatedTasks = generateTasksFromBatches(batches, selectedDate)
        
        setTasks(generatedTasks)
      } catch (error) {
        console.error('Error loading tasks:', error)
        showError('Load Error', 'Failed to load tasks for selected date')
      }
    }

    loadTasks()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadTasks, 30000)
    
    return () => clearInterval(interval)
  }, [wineryId, selectedDate, showError])

  // Auto-switch date at midnight Halifax time
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      const halifaxNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Halifax"}))
      const halifaxMidnight = new Date(halifaxNow)
      halifaxMidnight.setHours(24, 0, 0, 0) // Next midnight
      
      const msUntilMidnight = halifaxMidnight.getTime() - halifaxNow.getTime()
      
      const timeout = setTimeout(() => {
        // Auto-switch to today if user is viewing today
        const today = new Date()
        const halifaxToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Halifax"}))
        
        if (selectedDate.toDateString() === new Date(Date.now() - 24*60*60*1000).toDateString()) {
          // User was viewing yesterday, switch to today
          setSelectedDate(halifaxToday)
        }
        
        // Set up next check for tomorrow
        checkMidnight()
      }, msUntilMidnight)
      
      return timeout
    }
    
    const timeout = checkMidnight()
    return () => clearTimeout(timeout)
  }, [selectedDate])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your winery data...</p>
        </div>
      </div>
    )
  }

  // Helper functions
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    const halifaxToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    const halifaxDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    return halifaxDate.toDateString() === halifaxToday.toDateString()
  }

  const isFuture = (date: Date) => {
    const today = new Date()
    const halifaxToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    halifaxToday.setHours(0, 0, 0, 0)
    const halifaxDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    halifaxDate.setHours(0, 0, 0, 0)
    return halifaxDate > halifaxToday
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const halifaxToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Halifax"}))
    setSelectedDate(halifaxToday)
  }

  // Update toggleTaskCompletion function with stage-specific toggling
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    try {
      // Optimistically update UI
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)))

      // Update specific stage completion in backend
      await updateBatchStageStatus(task.batchId, task.stage, !task.completed)

      // Show success message
      if (!task.completed) {
        showSuccess("Task Completed", `${task.action} marked as done for ${task.customer}`)
        
        // Check if all tasks for the day are now completed for confetti
        const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
        if (updatedTasks.every(t => t.completed) && updatedTasks.length > 0) {
          setShowConfetti(true)
        }
      } else {
        showSuccess("Task Unmarked", `${task.action} unmarked for ${task.customer}`)
      }

    } catch (error) {
      // Revert optimistic update on error
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: task.completed } : t)))
      console.error('Error updating task:', error)
      showError("Update Failed", "Failed to update task status")
    }
  }

  // Group tasks by type
  const groupedTasks = tasks.reduce((groups: { [key: string]: Task[] }, task) => {
    const group = groups[task.type] || []
    group.push(task)
    groups[task.type] = group
    return groups
  }, {})

  const completedCount = tasks.filter((task) => task.completed).length
  const totalCount = tasks.length

  useEffect(() => {
    // Trigger confetti when all tasks become completed
    if (completedCount === totalCount && totalCount > 0 && completedCount > prevCompletedCount) {
      setShowConfetti(true)
    }
    setPrevCompletedCount(completedCount)
  }, [completedCount, totalCount, prevCompletedCount])

  // Get page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case "today":
        return `${wineryName} Tasks`
      case "batches":
        return "All Batches"
      case "new":
        return "Create New Batch"
      case "settings":
        return "Settings"
      default:
        return `${wineryName} Tasks`
    }
  }

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "today":
        return "BOP Tracker"
      case "batches":
        return "Manage your wine batches"
      case "new":
        return "Start a new wine batch"
      case "settings":
        return "Account and app preferences"
      default:
        return formatSelectedDate(selectedDate)
    }
  }

  function getTaskTypeHeader(taskType: string, date: Date) {
    const today = new Date()
    const isPast = date < today
    const isFutureDate = date > today

    if (isToday(date)) {
      return taskType // e.g. "Bottle Today"
    }

    const dateStr = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })

    if (taskType.includes("Bottle")) {
      return isPast ? `Bottled on ${dateStr}` : `Bottle on ${dateStr}`
    }
    if (taskType.includes("Filter")) {
      return isPast ? `Filtered on ${dateStr}` : `Filter on ${dateStr}`
    }
    if (taskType.includes("Rack")) {
      return isPast ? `Racked on ${dateStr}` : `Rack on ${dateStr}`
    }
    if (taskType.includes("Put-Up")) {
      return `Put-Up on ${dateStr}`
    }
    if (taskType === "Overdue") {
      return "Overdue"
    }
    return taskType
  }

  // ... existing code ...

  const [wineryAccessCode, setWineryAccessCode] = useState(() => {
    // Generate a 6-digit access code
    return Math.floor(100000 + Math.random() * 900000).toString()
  })

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "today":
        return (
          <div className="max-w-4xl mx-auto">
            {/* Date Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {formatSelectedDate(selectedDate)}
                  </h2>
                  {!isToday(selectedDate) && (
                    <button
                      onClick={goToToday}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      Go to Today
                    </button>
                  )}
                </div>
                <button
                  onClick={goToNextDay}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tasks */}
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isToday(selectedDate) ? "No tasks for today" : "No tasks for this date"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {isToday(selectedDate) 
                    ? "All caught up! Check back tomorrow for new tasks." 
                    : "No wine production tasks scheduled for this date."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([taskType, tasks]) => (
                  <div key={taskType} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {getTaskTypeHeader(taskType, selectedDate)}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {tasks.map((task) => (
                        <div key={task.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleTaskCompletion(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                task.completed
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400"
                              }`}
                            >
                              {task.completed && <Check className="w-4 h-4" />}
                            </button>
                            <div>
                              <p className={`font-medium ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
                                {task.action} {task.bopNumber} - {task.customer}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{task.wineKit}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      case "batches":
        return (
          <BatchesView 
            setActiveTab={setActiveTab} 
            wineryId={wineryId}
            showSuccess={showSuccess}
            showError={showError}
          />
        )
      
      case "new":
        return (
          <NewBatchView 
            wineryId={wineryId} 
            userProfile={userProfile} 
            showSuccess={showSuccess} 
            showError={showError}
          />
        )
      
      case "settings":
        return (
          <SettingsView wineryAccessCode={wineryAccessCode} userProfile={userProfile} showSuccess={showSuccess} showError={showError} />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">{getPageSubtitle()}</p>
            </div>
            {/* Mobile and Desktop Progress Circle */}
            {activeTab === "today" && (
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 relative" ref={progressCircleRef}>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      completedCount === totalCount && totalCount > 0
                        ? "text-green-500 dark:text-green-400"
                        : "text-blue-600 dark:text-blue-500"
                    }
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{
                      transition: "stroke-dasharray 0.3s ease-in-out",
                    }}
                  />
                </svg>
                {/* Center progress counter inside the ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                {/* Confetti positioned at the center of the progress circle */}
                {showConfetti && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">{renderContent()}</main>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add ToastContainer at the end */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
