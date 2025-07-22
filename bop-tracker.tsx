"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  CalendarIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wine,
  Beaker,
  Settings,
  User,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { format, addDays, subDays, isToday, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  winery_id: string
  wineries: {
    name: string
    join_code: string
  }
}

interface Task {
  id: string
  title: string
  description: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed"
  batch_id?: string
  assigned_to: string
  created_at: string
}

interface Batch {
  id: string
  batch_number: string
  wine_type: string
  grape_variety: string
  vintage_year: number
  volume_liters: number
  status: "active" | "completed" | "archived"
  created_at: string
  harvest_date: string
  fermentation_start: string
  pressing_date?: string
  malolactic_start?: string
  racking_dates: string[]
  bottling_date?: string
  notes: string
  current_stage: string
  winery_id: string
}

export default function BOPTracker({ userProfile }: { userProfile: UserProfile }) {
  const [activeTab, setActiveTab] = useState("today")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [showNewBatchForm, setShowNewBatchForm] = useState(false)

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    batch_number: "",
    wine_type: "",
    grape_variety: "",
    vintage_year: new Date().getFullYear(),
    volume_liters: 0,
    harvest_date: "",
    notes: "",
  })

  const supabase = createClient()
  const wineryName = userProfile.wineries?.name || "Your Winery"

  useEffect(() => {
    fetchTasks()
    fetchBatches()
  }, [selectedDate])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("winery_id", userProfile.winery_id)
        .gte("due_date", format(selectedDate, "yyyy-MM-dd"))
        .lte("due_date", format(addDays(selectedDate, 1), "yyyy-MM-dd"))
        .order("due_date", { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("winery_id", userProfile.winery_id)
        .order(sortBy, { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"

    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

      if (error) throw error

      setTasks(
        tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus as "pending" | "completed" } : task)),
      )
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const createNewBatch = async () => {
    try {
      const batchData = {
        ...newBatch,
        winery_id: userProfile.winery_id,
        status: "active",
        current_stage: "harvest",
        racking_dates: [],
      }

      const { data, error } = await supabase.from("batches").insert([batchData]).select().single()

      if (error) throw error

      setBatches([data, ...batches])
      setShowNewBatchForm(false)
      setNewBatch({
        batch_number: "",
        wine_type: "",
        grape_variety: "",
        vintage_year: new Date().getFullYear(),
        volume_liters: 0,
        harvest_date: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error creating batch:", error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.wine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.grape_variety.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || batch.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const calculateDaysInStage = (batch: Batch) => {
    const startDate = batch.fermentation_start ? parseISO(batch.fermentation_start) : parseISO(batch.harvest_date)
    const daysDiff = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24))
    return Math.max(0, daysDiff)
  }

  const renderTodayView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isToday(selectedDate) && <Badge variant="secondary">Today</Badge>}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks for this date</h3>
              <p className="text-gray-600 text-center">
                {isToday(selectedDate) ? "You're all caught up for today!" : "No tasks scheduled for this date."}
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className={cn("transition-all duration-200 hover:shadow-md", task.status === "completed" && "opacity-75")}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6 mt-1"
                      onClick={() => toggleTaskComplete(task.id, task.status)}
                    >
                      <CheckCircle2
                        className={cn(
                          "h-5 w-5",
                          task.status === "completed"
                            ? "text-green-600 fill-green-100"
                            : "text-gray-400 hover:text-green-600",
                        )}
                      />
                    </Button>
                    <div className="flex-1">
                      <h3 className={cn("font-semibold", task.status === "completed" && "line-through text-gray-500")}>
                        {task.title}
                      </h3>
                      {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <span className="text-xs text-gray-500">Due: {format(parseISO(task.due_date), "h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  const renderBatchesView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="batch_number">Batch Number</SelectItem>
              <SelectItem value="wine_type">Wine Type</SelectItem>
              <SelectItem value="vintage_year">Vintage Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewBatchForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Batch
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredBatches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Wine className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No batches found</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first batch to get started."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button onClick={() => setShowNewBatchForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Batch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredBatches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{batch.batch_number}</h3>
                      <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Wine Type:</span>
                        <p className="font-medium">{batch.wine_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Grape Variety:</span>
                        <p className="font-medium">{batch.grape_variety}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vintage:</span>
                        <p className="font-medium">{batch.vintage_year}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Volume:</span>
                        <p className="font-medium">{batch.volume_liters}L</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <span>Stage: {batch.current_stage}</span>
                      <span>•</span>
                      <span>{calculateDaysInStage(batch)} days in current stage</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBatch(batch)
                        setShowBatchDialog(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  const renderNewBatchView = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Batch</CardTitle>
          <CardDescription>Add a new wine batch to track through the production process.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={newBatch.batch_number}
                onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                placeholder="e.g., CB2024-001"
              />
            </div>
            <div>
              <Label htmlFor="wine_type">Wine Type</Label>
              <Select
                value={newBatch.wine_type}
                onValueChange={(value) => setNewBatch({ ...newBatch, wine_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wine type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red Wine</SelectItem>
                  <SelectItem value="white">White Wine</SelectItem>
                  <SelectItem value="rosé">Rosé Wine</SelectItem>
                  <SelectItem value="sparkling">Sparkling Wine</SelectItem>
                  <SelectItem value="dessert">Dessert Wine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grape_variety">Grape Variety</Label>
              <Input
                id="grape_variety"
                value={newBatch.grape_variety}
                onChange={(e) => setNewBatch({ ...newBatch, grape_variety: e.target.value })}
                placeholder="e.g., Cabernet Sauvignon"
              />
            </div>
            <div>
              <Label htmlFor="vintage_year">Vintage Year</Label>
              <Input
                id="vintage_year"
                type="number"
                value={newBatch.vintage_year}
                onChange={(e) => setNewBatch({ ...newBatch, vintage_year: Number.parseInt(e.target.value) })}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volume_liters">Volume (Liters)</Label>
              <Input
                id="volume_liters"
                type="number"
                value={newBatch.volume_liters}
                onChange={(e) => setNewBatch({ ...newBatch, volume_liters: Number.parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="harvest_date">Harvest Date</Label>
              <Input
                id="harvest_date"
                type="date"
                value={newBatch.harvest_date}
                onChange={(e) => setNewBatch({ ...newBatch, harvest_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newBatch.notes}
              onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
              placeholder="Add any additional notes about this batch..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowNewBatchForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={createNewBatch}
              disabled={!newBatch.batch_number || !newBatch.wine_type || !newBatch.grape_variety}
            >
              Create Batch
            </Button>
          </div>
        </CardContent>
      </Card>

      {newBatch.batch_number && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Batch:</strong> {newBatch.batch_number}
              </div>
              <div>
                <strong>Type:</strong> {newBatch.wine_type}
              </div>
              <div>
                <strong>Variety:</strong> {newBatch.grape_variety}
              </div>
              <div>
                <strong>Vintage:</strong> {newBatch.vintage_year}
              </div>
              <div>
                <strong>Volume:</strong> {newBatch.volume_liters}L
              </div>
              {newBatch.harvest_date && (
                <div>
                  <strong>Harvest:</strong> {format(parseISO(newBatch.harvest_date), "PPP")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderSettingsView = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account information and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={userProfile.full_name} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={userProfile.email} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={userProfile.role} disabled />
          </div>
          <div>
            <Label>Winery</Label>
            <Input value={wineryName} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive email updates about your batches</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Task Reminders</Label>
              <p className="text-sm text-gray-600">Get reminded about upcoming tasks</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Center
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <User className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          <Separator />
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wine className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">BOP Tracker</h1>
              <p className="text-sm text-gray-600">{wineryName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Today</span>
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center space-x-2">
              <Beaker className="h-4 w-4" />
              <span>Batches</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">{renderTodayView()}</TabsContent>
          <TabsContent value="batches">{renderBatchesView()}</TabsContent>
          <TabsContent value="new">{renderNewBatchView()}</TabsContent>
          <TabsContent value="settings">{renderSettingsView()}</TabsContent>
        </Tabs>
      </main>

      {/* Batch Detail Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              {selectedBatch && `${selectedBatch.batch_number} - ${selectedBatch.wine_type}`}
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Grape Variety:</span>
                  <p className="font-medium">{selectedBatch.grape_variety}</p>
                </div>
                <div>
                  <span className="text-gray-500">Vintage Year:</span>
                  <p className="font-medium">{selectedBatch.vintage_year}</p>
                </div>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <p className="font-medium">{selectedBatch.volume_liters}L</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Stage:</span>
                  <p className="font-medium">{selectedBatch.current_stage}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div>Harvest: {format(parseISO(selectedBatch.harvest_date), "PPP")}</div>
                  {selectedBatch.fermentation_start && (
                    <div>Fermentation Started: {format(parseISO(selectedBatch.fermentation_start), "PPP")}</div>
                  )}
                  {selectedBatch.pressing_date && (
                    <div>Pressed: {format(parseISO(selectedBatch.pressing_date), "PPP")}</div>
                  )}
                  {selectedBatch.bottling_date && (
                    <div>Bottled: {format(parseISO(selectedBatch.bottling_date), "PPP")}</div>
                  )}
                </div>
              </div>

              {selectedBatch.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedBatch.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
