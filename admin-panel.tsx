"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit2, Check, X, MessageSquare, Users, Building2 } from "lucide-react"
import { generateAccessCode } from "../utils/access-code"
import type { Winery, User, SupportMessage } from "../types/admin"

// Sample data
const initialWineries: Winery[] = [
  {
    id: 1,
    name: "Sunset Valley Winery",
    location: "Napa Valley, CA",
    accessCode: "ABC123",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Mountain View Vineyards",
    location: "Sonoma County, CA",
    accessCode: "DEF456",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Coastal Breeze Winery",
    location: "Monterey, CA",
    accessCode: "GHI789",
    createdAt: "2024-03-10",
  },
]

const initialUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@sunsetvalley.com",
    wineryId: 1,
    wineryName: "Sunset Valley Winery",
    createdAt: "2024-01-16",
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@mountainview.com",
    wineryId: 2,
    wineryName: "Mountain View Vineyards",
    createdAt: "2024-02-21",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily@coastalbreeze.com",
    wineryId: 3,
    wineryName: "Coastal Breeze Winery",
    createdAt: "2024-03-11",
  },
  {
    id: 4,
    name: "David Kim",
    email: "david@sunsetvalley.com",
    wineryId: 1,
    wineryName: "Sunset Valley Winery",
    createdAt: "2024-03-15",
  },
]

const initialSupportMessages: SupportMessage[] = [
  {
    id: 1,
    subject: "Unable to add new batch",
    message:
      "I'm getting an error when trying to create a new batch. The form won't submit and shows a validation error.",
    userEmail: "sarah@sunsetvalley.com",
    wineryName: "Sunset Valley Winery",
    status: "open",
    createdAt: "2024-03-20",
  },
  {
    id: 2,
    subject: "Dark mode not working",
    message: "The dark mode toggle in settings doesn't seem to work properly. It switches but the colors don't change.",
    userEmail: "mike@mountainview.com",
    wineryName: "Mountain View Vineyards",
    status: "resolved",
    createdAt: "2024-03-18",
  },
  {
    id: 3,
    subject: "Question about batch timeline",
    message: "How do I modify the timeline for a batch that's already been created? The dates seem to be locked.",
    userEmail: "emily@coastalbreeze.com",
    wineryName: "Coastal Breeze Winery",
    status: "open",
    createdAt: "2024-03-22",
  },
]

export default function AdminPanel() {
  const [wineries, setWineries] = useState<Winery[]>(initialWineries)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(initialSupportMessages)
  const [selectedWineryId, setSelectedWineryId] = useState<number | null>(null)
  const [editingWineryId, setEditingWineryId] = useState<number | null>(null)
  const [editWineryForm, setEditWineryForm] = useState({ name: "", location: "" })

  // New winery form
  const [newWineryForm, setNewWineryForm] = useState({
    name: "",
    location: "",
  })

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [showNewWineryForm, setShowNewWineryForm] = useState(false)
  const [showNewUserForm, setShowNewUserForm] = useState(false)

  const selectedWinery = wineries.find((w) => w.id === selectedWineryId)
  const selectedWineryUsers = users.filter((u) => u.wineryId === selectedWineryId)

  const handleDeleteWinery = (wineryId: number) => {
    if (confirm("Are you sure you want to delete this winery? This will also delete all associated users.")) {
      setWineries(wineries.filter((w) => w.id !== wineryId))
      setUsers(users.filter((u) => u.wineryId !== wineryId))
      if (selectedWineryId === wineryId) {
        setSelectedWineryId(null)
      }
    }
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== userId))
    }
  }

  const handleAddWinery = () => {
    if (newWineryForm.name && newWineryForm.location) {
      const newWinery: Winery = {
        id: Math.max(...wineries.map((w) => w.id)) + 1,
        name: newWineryForm.name,
        location: newWineryForm.location,
        accessCode: generateAccessCode(),
        createdAt: new Date().toISOString().split("T")[0],
      }
      setWineries([...wineries, newWinery])
      setNewWineryForm({ name: "", location: "" })
      setShowNewWineryForm(false)
    }
  }

  const handleAddUser = () => {
    if (newUserForm.name && newUserForm.email && newUserForm.password && selectedWineryId) {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        name: newUserForm.name,
        email: newUserForm.email,
        wineryId: selectedWineryId,
        wineryName: selectedWinery?.name || "",
        createdAt: new Date().toISOString().split("T")[0],
      }
      setUsers([...users, newUser])
      setNewUserForm({ name: "", email: "", password: "" })
      setShowNewUserForm(false)
    }
  }

  const handleEditWinery = (winery: Winery) => {
    setEditingWineryId(winery.id)
    setEditWineryForm({ name: winery.name, location: winery.location })
  }

  const handleSaveWineryEdit = () => {
    if (editingWineryId && editWineryForm.name && editWineryForm.location) {
      setWineries(
        wineries.map((w) =>
          w.id === editingWineryId ? { ...w, name: editWineryForm.name, location: editWineryForm.location } : w,
        ),
      )
      // Update users with new winery name
      setUsers(users.map((u) => (u.wineryId === editingWineryId ? { ...u, wineryName: editWineryForm.name } : u)))
      setEditingWineryId(null)
      setEditWineryForm({ name: "", location: "" })
    }
  }

  const handleCancelWineryEdit = () => {
    setEditingWineryId(null)
    setEditWineryForm({ name: "", location: "" })
  }

  const handleResolveSupportMessage = (messageId: number) => {
    setSupportMessages(
      supportMessages.map((msg) => (msg.id === messageId ? { ...msg, status: "resolved" as const } : msg)),
    )
  }

  const handleReopenSupportMessage = (messageId: number) => {
    setSupportMessages(supportMessages.map((msg) => (msg.id === messageId ? { ...msg, status: "open" as const } : msg)))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage wineries, users, and support messages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Winery Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Winery Management
              </CardTitle>
              <Button onClick={() => setShowNewWineryForm(true)} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Winery
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wineries.map((winery) => (
                  <div
                    key={winery.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWineryId === winery.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedWineryId(winery.id)}
                  >
                    {editingWineryId === winery.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editWineryForm.name}
                          onChange={(e) => setEditWineryForm({ ...editWineryForm, name: e.target.value })}
                          placeholder="Winery name"
                        />
                        <Input
                          value={editWineryForm.location}
                          onChange={(e) => setEditWineryForm({ ...editWineryForm, location: e.target.value })}
                          placeholder="Location"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveWineryEdit} size="sm" className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelWineryEdit}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-transparent"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{winery.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{winery.location}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Access Code: <span className="font-mono font-medium">{winery.accessCode}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditWinery(winery)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteWinery(winery.id)
                            }}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New Winery Form */}
              {showNewWineryForm && (
                <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add New Winery</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="wineryName">Winery Name</Label>
                      <Input
                        id="wineryName"
                        value={newWineryForm.name}
                        onChange={(e) => setNewWineryForm({ ...newWineryForm, name: e.target.value })}
                        placeholder="Enter winery name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wineryLocation">Location</Label>
                      <Input
                        id="wineryLocation"
                        value={newWineryForm.location}
                        onChange={(e) => setNewWineryForm({ ...newWineryForm, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddWinery} size="sm">
                        Create Winery
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewWineryForm(false)
                          setNewWineryForm({ name: "", location: "" })
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
                {selectedWinery && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedWinery.name}
                  </Badge>
                )}
              </CardTitle>
              {selectedWineryId && (
                <Button onClick={() => setShowNewUserForm(true)} size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedWineryId ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Select a winery to manage its users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedWineryUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{user.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={() => handleDeleteUser(user.id)} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {selectedWineryUsers.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No users in this winery</p>
                    </div>
                  )}

                  {/* New User Form */}
                  {showNewUserForm && (
                    <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add New User</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="userName">Name</Label>
                          <Input
                            id="userName"
                            value={newUserForm.name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                            placeholder="Enter user name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="userEmail">Email</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="userPassword">Password</Label>
                          <Input
                            id="userPassword"
                            type="password"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            placeholder="Enter password"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddUser} size="sm">
                            Create User
                          </Button>
                          <Button
                            onClick={() => {
                              setShowNewUserForm(false)
                              setNewUserForm({ name: "", email: "", password: "" })
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Support Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Support Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supportMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg ${
                    message.status === "open"
                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                      : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {message.subject || "No Subject"}
                        </h4>
                        <Badge variant={message.status === "open" ? "destructive" : "default"} className="text-xs">
                          {message.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        From: {message.userEmail} ({message.wineryName})
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {message.status === "open" ? (
                        <Button onClick={() => handleResolveSupportMessage(message.id)} size="sm" variant="default">
                          Mark Resolved
                        </Button>
                      ) : (
                        <Button onClick={() => handleReopenSupportMessage(message.id)} size="sm" variant="outline">
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                  </div>
                </div>
              ))}

              {supportMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No support messages</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
