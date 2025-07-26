"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit2, Check, X, MessageSquare, Users, Building2 } from "lucide-react"
import type { Winery, User, SupportMessage } from "./types/admin"
import {
  createWinery,
  updateWinery,
  deleteWinery,
  createUser,
  deleteUser,
  toggleSupportMessageStatus,
} from "./app/admin/actions"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function ShowUserIdButton() {
  async function showId() {
    const { data: { user } } = await supabase.auth.getUser()
    alert('Your Auth User ID: ' + user?.id)
    console.log('Your Auth User ID:', user?.id)
  }
  return <button onClick={showId} style={{marginBottom: 16, padding: 8, background: '#eee', borderRadius: 4}}>Show My Auth User ID</button>
}

interface AdminPanelProps {
  initialWineries: Winery[]
  initialUsers: User[]
  initialSupportMessages: SupportMessage[]
}

export default function AdminPanel({ initialWineries, initialUsers, initialSupportMessages }: AdminPanelProps) {
  const [isPending, startTransition] = useTransition()

  // State is now controlled by data passed via props, but we can keep local copies for optimistic updates if needed.
  // For simplicity, we'll rely on revalidation from server actions.
  const wineries = initialWineries
  const users = initialUsers
  const supportMessages = initialSupportMessages

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
  const selectedWineryUsers = users.filter((u) => u.winery_id === selectedWineryId)

  const handleDeleteWinery = (wineryId: number) => {
    if (confirm("Are you sure you want to delete this winery? This will also delete all associated users.")) {
      startTransition(() => {
        deleteWinery(wineryId)
      })
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      startTransition(() => {
        deleteUser(userId)
      })
    }
  }

  const handleAddWinery = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    startTransition(() => {
      createWinery(formData).then(() => {
        setNewWineryForm({ name: "", location: "" })
        setShowNewWineryForm(false)
      })
    })
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWineryId) return
    const formData = new FormData(e.target as HTMLFormElement)
    formData.append("wineryId", selectedWineryId.toString())

    startTransition(() => {
      createUser(formData).then(() => {
        setNewUserForm({ name: "", email: "", password: "" })
        setShowNewUserForm(false)
      })
    })
  }

  const handleEditWinery = (winery: Winery) => {
    setEditingWineryId(winery.id)
    setEditWineryForm({ name: winery.name, location: winery.location })
  }

  const handleSaveWineryEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWineryId) return
    const formData = new FormData(e.target as HTMLFormElement)
    startTransition(() => {
      updateWinery(editingWineryId, formData).then(() => {
        setEditingWineryId(null)
        setEditWineryForm({ name: "", location: "" })
      })
    })
  }

  const handleCancelWineryEdit = () => {
    setEditingWineryId(null)
    setEditWineryForm({ name: "", location: "" })
  }

  const handleToggleSupportMessage = (messageId: number, status: "open" | "resolved") => {
    startTransition(() => {
      toggleSupportMessageStatus(messageId, status)
    })
  }

  // The rest of the JSX remains largely the same, but form submissions
  // will now use the server action handlers.
  // For example, the "Add New Winery" form:
  /*
    <form onSubmit={handleAddWinery}>
      <Input name="name" ... />
      <Input name="location" ... />
      <Button type="submit">Create</Button>
    </form>
  */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ShowUserIdButton />
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
                      <form onSubmit={handleSaveWineryEdit} className="space-y-3">
                        <Input name="name" defaultValue={editWineryForm.name} placeholder="Winery name" />
                        <Input name="location" defaultValue={editWineryForm.location} placeholder="Location" />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex items-center gap-1">
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
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{winery.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{winery.location}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Join Code: <span className="font-mono font-medium">{winery.join_code}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Users: {winery.user_count}
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
                  <form onSubmit={handleAddWinery} className="space-y-3">
                    <div>
                      <Label htmlFor="wineryName">Winery Name</Label>
                      <Input id="wineryName" name="name" placeholder="Enter winery name" />
                    </div>
                    <div>
                      <Label htmlFor="wineryLocation">Location</Label>
                      <Input id="wineryLocation" name="location" placeholder="Enter location" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
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
                  </form>
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
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
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
                      <form onSubmit={handleAddUser} className="space-y-3">
                        <div>
                          <Label htmlFor="userName">Name</Label>
                          <Input id="userName" name="name" placeholder="Enter user name" />
                        </div>
                        <div>
                          <Label htmlFor="userEmail">Email</Label>
                          <Input id="userEmail" type="email" name="email" placeholder="Enter email address" />
                        </div>
                        <div>
                          <Label htmlFor="userPassword">Password</Label>
                          <Input id="userPassword" type="password" name="password" placeholder="Enter password" />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">
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
                      </form>
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
                        From: {message.user_email} ({message.winery_name})
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {message.status === "open" ? (
                        <Button
                          onClick={() => handleToggleSupportMessage(message.id, "resolved")}
                          size="sm"
                          variant="default"
                        >
                          Mark Resolved
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleToggleSupportMessage(message.id, "open")}
                          size="sm"
                          variant="outline"
                        >
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
