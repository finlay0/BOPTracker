"use client"

import { useState } from "react"
import { Plus, Users, Wine, Mail, Building2, MessageSquare, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Sample winery data
const wineriesData = [
  {
    id: 1,
    name: "Sunset Valley Winery",
    userCount: 8,
    batchCount: 156,
    location: "Napa Valley, CA",
    status: "active",
  },
  {
    id: 2,
    name: "Mountain Ridge Cellars",
    userCount: 5,
    batchCount: 89,
    location: "Sonoma, CA",
    status: "active",
  },
  {
    id: 3,
    name: "Coastal Breeze Wines",
    userCount: 12,
    batchCount: 234,
    location: "Monterey, CA",
    status: "active",
  },
  {
    id: 4,
    name: "Heritage Oak Winery",
    userCount: 3,
    batchCount: 45,
    location: "Paso Robles, CA",
    status: "trial",
  },
]

// Sample user data
const usersData = [
  {
    id: 1,
    email: "sarah@sunsetvalley.com",
    role: "Manager",
    winery: "Sunset Valley Winery",
    status: "active",
    lastLogin: "2024-07-15",
  },
  {
    id: 2,
    email: "mike@sunsetvalley.com",
    role: "Staff",
    winery: "Sunset Valley Winery",
    status: "active",
    lastLogin: "2024-07-14",
  },
  {
    id: 3,
    email: "emily@mountainridge.com",
    role: "Owner",
    winery: "Mountain Ridge Cellars",
    status: "active",
    lastLogin: "2024-07-15",
  },
  {
    id: 4,
    email: "david@coastalbreeze.com",
    role: "Manager",
    winery: "Coastal Breeze Wines",
    status: "active",
    lastLogin: "2024-07-13",
  },
  {
    id: 5,
    email: "lisa@coastalbreeze.com",
    role: "Staff",
    winery: "Coastal Breeze Wines",
    status: "inactive",
    lastLogin: "2024-07-01",
  },
  {
    id: 6,
    email: "robert@heritageoak.com",
    role: "Owner",
    winery: "Heritage Oak Winery",
    status: "active",
    lastLogin: "2024-07-12",
  },
]

// Sample support messages data
const supportMessagesData = [
  {
    id: 1,
    winery: "Sunset Valley Winery",
    user: "sarah@sunsetvalley.com",
    date: "2024-07-15",
    subject: "Batch tracking issue",
    preview: "Having trouble with batch #1042 not showing correct dates...",
    message:
      "Having trouble with batch #1042 not showing correct dates. The racking date seems to be off by a week and it's causing confusion with our schedule. Can you please help us understand what might be causing this issue?",
    status: "open",
  },
  {
    id: 2,
    winery: "Mountain Ridge Cellars",
    user: "emily@mountainridge.com",
    date: "2024-07-14",
    subject: "User access request",
    preview: "Need to add two new staff members to our account...",
    message:
      "Need to add two new staff members to our account. They will be helping with batch management and need full access to create and edit batches. Their emails are john@mountainridge.com and mary@mountainridge.com.",
    status: "resolved",
  },
  {
    id: 3,
    winery: "Coastal Breeze Wines",
    user: "david@coastalbreeze.com",
    date: "2024-07-13",
    subject: "Export functionality",
    preview: "Is there a way to export our batch data to CSV format?...",
    message:
      "Is there a way to export our batch data to CSV format? We need to provide monthly reports to our investors and having the data in spreadsheet format would be very helpful. Also, can we include customer information in the export?",
    status: "open",
  },
  {
    id: 4,
    winery: "Heritage Oak Winery",
    user: "robert@heritageoak.com",
    date: "2024-07-12",
    subject: "Billing question",
    preview: "Question about our trial period and upgrade options...",
    message:
      "Question about our trial period and upgrade options. We're really happy with the system so far and want to upgrade to a full account. What are the pricing options and what additional features do we get with the paid plan?",
    status: "resolved",
  },
  {
    id: 5,
    winery: "Sunset Valley Winery",
    user: "mike@sunsetvalley.com",
    date: "2024-07-11",
    subject: "Mobile app feedback",
    preview: "Love the mobile interface! Just a few suggestions...",
    message:
      "Love the mobile interface! Just a few suggestions for improvement: 1) It would be great to have push notifications for upcoming tasks, 2) The batch detail page could use a bit more spacing on smaller screens, 3) Maybe add a quick action button to mark tasks complete from the main list. Overall, fantastic work!",
    status: "open",
  },
]

export default function AdminPanel() {
  const [wineries] = useState(wineriesData)
  const [users] = useState(usersData)
  const [supportMessages] = useState(supportMessagesData)
  const [showAddWineryModal, setShowAddWineryModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<(typeof supportMessagesData)[0] | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "trial":
        return "bg-blue-100 text-blue-700"
      case "inactive":
        return "bg-gray-100 text-gray-600"
      case "open":
        return "bg-orange-100 text-orange-700"
      case "resolved":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-purple-100 text-purple-700"
      case "Manager":
        return "bg-blue-100 text-blue-700"
      case "Staff":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const handleAddWinery = () => {
    setShowAddWineryModal(true)
  }

  const handleAddUser = () => {
    setShowAddUserModal(true)
  }

  const closeModals = () => {
    setShowAddWineryModal(false)
    setShowAddUserModal(false)
  }

  const handleMessageClick = (message: (typeof supportMessagesData)[0]) => {
    setSelectedMessage(message)
  }

  const closeMessageDetail = () => {
    setSelectedMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage wineries, users, and support requests</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Winery Management */}
        <section>
          <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Winery Management</h2>
                  <p className="text-sm text-gray-600 mt-1">{wineries.length} wineries</p>
                </div>
                <Button onClick={handleAddWinery} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Winery
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {wineries.map((winery) => (
                <div key={winery.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{winery.name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(winery.status)}`}>
                          {winery.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{winery.location}</p>
                      <div className="flex items-center gap-6 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{winery.userCount} users</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Wine className="w-4 h-4" />
                          <span>{winery.batchCount} batches</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* User Management */}
        <section>
          <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-600 mt-1">{users.length} users</p>
                </div>
                <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.email}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 ml-7">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.winery}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Last: {formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Support Messages */}
        <section>
          <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Support Messages</h2>
                <p className="text-sm text-gray-600 mt-1">{supportMessages.length} messages</p>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {supportMessages.map((message) => (
                <div
                  key={message.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{message.subject}</span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(message.status)}`}
                        >
                          {message.status}
                        </span>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-sm text-gray-600 truncate">{message.preview}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{message.winery}</span>
                          <span>•</span>
                          <span>{message.user}</span>
                          <span>•</span>
                          <span>{formatDate(message.date)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* Add Winery Modal */}
      {showAddWineryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Winery</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Winery Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter winery name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter owner email"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModals}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeModals}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add Winery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Winery</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {wineries.map((winery) => (
                    <option key={winery.id} value={winery.name}>
                      {winery.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModals}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeModals}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{selectedMessage.winery}</span>
                  <span>•</span>
                  <span>{selectedMessage.user}</span>
                  <span>•</span>
                  <span>{formatDate(selectedMessage.date)}</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedMessage.status)}`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>
              </div>
              <button onClick={closeMessageDetail} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-900 leading-relaxed">{selectedMessage.message}</p>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={closeMessageDetail}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
