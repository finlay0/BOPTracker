"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit2, Check, X, MessageSquare, Users, Building2 } from "lucide-react"
import { supabase } from "@/utils/supabase/client"

interface Winery {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  join_code: string
  created_at: string
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  winery_id: string
  role: string
  created_at: string
  wineries?: { name: string }
}

interface SupportMessage {
  id: string
  subject: string
  message: string
  status: 'open' | 'resolved'
  created_at: string
  user_profiles?: {
    email: string
    wineries?: { name: string }
  }
}

export default function AdminPanel() {
  const [wineries, setWineries] = useState<Winery[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [selectedWineryId, setSelectedWineryId] = useState<string | null>(null)
  const [editingWineryId, setEditingWineryId] = useState<string | null>(null)
  const [editWineryForm, setEditWineryForm] = useState({ name: "", address: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New winery form
  const [newWineryForm, setNewWineryForm] = useState({
    name: "",
    address: "",
  })

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  })

  const [showNewWineryForm, setShowNewWineryForm] = useState(false)
  const [showNewUserForm, setShowNewUserForm] = useState(false)

  // Load data from backend
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadWineries(),
        loadUsers(),
        loadSupportMessages()
      ])
    } catch (error) {
      console.error('Error loading admin data:', error)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const loadWineries = async () => {
    const { data, error } = await supabase
      .from('wineries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading wineries:', error)
      throw error
    }

    setWineries(data || [])
  }

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        wineries (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      throw error
    }

    setUsers(data || [])
  }

  const loadSupportMessages = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        user_profiles (
          email,
          wineries (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading support messages:', error)
      throw error
    }

    setSupportMessages(data || [])
  }

  const selectedWinery = wineries.find((w) => w.id === selectedWineryId)
  const selectedWineryUsers = users.filter((u) => u.winery_id === selectedWineryId)

  const handleDeleteWinery = async (wineryId: string) => {
    if (!confirm("Are you sure you want to delete this winery? This will also delete all associated users and batches.")) {
      return
    }

    try {
      const { error } = await supabase
        .from('wineries')
        .delete()
        .eq('id', wineryId)

      if (error) {
        console.error('Error deleting winery:', error)
        alert('Failed to delete winery')
        return
      }

      setWineries(wineries.filter((w) => w.id !== wineryId))
      if (selectedWineryId === wineryId) {
        setSelectedWineryId(null)
      }
      alert('Winery deleted successfully')
    } catch (error) {
      console.error('Error deleting winery:', error)
      alert('Failed to delete winery')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      // Note: This requires service role key to work properly
      // For now, we'll try with the regular client
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) {
        console.error('Error deleting user:', error)
        // If admin operations fail, provide helpful message
        alert('Failed to delete user. Admin operations require service role permissions. Please contact system administrator.')
        return
      }

      setUsers(users.filter((u) => u.id !== userId))
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Admin operations require service role permissions.')
    }
  }

  const handleAddWinery = async () => {
    if (!newWineryForm.name || !newWineryForm.address) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('wineries')
        .insert({
          name: newWineryForm.name,
          address: newWineryForm.address,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating winery:', error)
        alert('Failed to create winery')
        return
      }

      setWineries([data, ...wineries])
      setNewWineryForm({ name: "", address: "" })
      setShowNewWineryForm(false)
      alert('Winery created successfully')
    } catch (error) {
      console.error('Error creating winery:', error)
      alert('Failed to create winery')
    }
  }

  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !selectedWineryId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Note: This requires service role key to work properly
      // For now, we'll try with the regular client
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        email_confirm: true
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        // If admin operations fail, provide helpful message
        alert('Failed to create user. Admin operations require service role permissions. Please contact system administrator.')
        return
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: newUserForm.email,
          first_name: newUserForm.first_name || null,
          last_name: newUserForm.last_name || null,
          winery_id: selectedWineryId,
          role: 'member'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Clean up auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup user:', cleanupError)
        }
        alert('Failed to create user profile')
        return
      }

      await loadUsers() // Reload users
      setNewUserForm({ email: "", password: "", first_name: "", last_name: "" })
      setShowNewUserForm(false)
      alert('User created successfully')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Admin operations require service role permissions.')
    }
  }

  const handleEditWinery = (winery: Winery) => {
    setEditingWineryId(winery.id)
    setEditWineryForm({ name: winery.name, address: winery.address || "" })
  }

  const handleSaveWineryEdit = async () => {
    if (!editingWineryId || !editWineryForm.name || !editWineryForm.address) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase
        .from('wineries')
        .update({
          name: editWineryForm.name,
          address: editWineryForm.address,
        })
        .eq('id', editingWineryId)

      if (error) {
        console.error('Error updating winery:', error)
        alert('Failed to update winery')
        return
      }

      setWineries(
        wineries.map((w) =>
          w.id === editingWineryId ? { ...w, name: editWineryForm.name, address: editWineryForm.address } : w,
        ),
      )
      setEditingWineryId(null)
      setEditWineryForm({ name: "", address: "" })
      alert('Winery updated successfully')
    } catch (error) {
      console.error('Error updating winery:', error)
      alert('Failed to update winery')
    }
  }

  const handleCancelWineryEdit = () => {
    setEditingWineryId(null)
    setEditWineryForm({ name: "", address: "" })
  }

  const handleResolveSupportMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: 'resolved' })
        .eq('id', messageId)

      if (error) {
        console.error('Error updating support message:', error)
        alert('Failed to update support message')
        return
      }

      setSupportMessages(
        supportMessages.map((msg) => (msg.id === messageId ? { ...msg, status: "resolved" as const } : msg)),
      )
    } catch (error) {
      console.error('Error updating support message:', error)
      alert('Failed to update support message')
    }
  }

  const handleReopenSupportMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: 'open' })
        .eq('id', messageId)

      if (error) {
        console.error('Error updating support message:', error)
        alert('Failed to update support message')
        return
      }

      setSupportMessages(
        supportMessages.map((msg) => (msg.id === messageId ? { ...msg, status: "open" as const } : msg))
      )
    } catch (error) {
      console.error('Error updating support message:', error)
      alert('Failed to update support message')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading admin data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={loadData}>Retry</Button>
          </div>
        </div>
      </div>
    )
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
                          value={editWineryForm.address}
                          onChange={(e) => setEditWineryForm({ ...editWineryForm, address: e.target.value })}
                          placeholder="Address"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveWineryEdit} size="sm">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button onClick={handleCancelWineryEdit} variant="outline" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{winery.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{winery.address}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Access Code: <span className="font-mono font-medium">{winery.join_code}</span>
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
                      <Label htmlFor="wineryAddress">Address</Label>
                      <Input
                        id="wineryAddress"
                        value={newWineryForm.address}
                        onChange={(e) => setNewWineryForm({ ...newWineryForm, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddWinery} size="sm">
                        Create Winery
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewWineryForm(false)
                          setNewWineryForm({ name: "", address: "" })
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
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {user.first_name} {user.last_name}
                        </h4>
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
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="userFirstName">First Name</Label>
                          <Input
                            id="userFirstName"
                            value={newUserForm.first_name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="userLastName">Last Name</Label>
                          <Input
                            id="userLastName"
                            value={newUserForm.last_name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                            placeholder="Enter last name"
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
                              setNewUserForm({ email: "", password: "", first_name: "", last_name: "" })
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
                        From: {message.user_profiles?.email || "N/A"} ({message.user_profiles?.wineries?.name || "N/A"})
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
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

