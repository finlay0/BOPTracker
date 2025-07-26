"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, User, Wine, Clock, Edit2, Save, X, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getBatch, updateBatchNotes, type Batch } from "@/lib/database"

interface BatchDetailProps {
  batchId: string
  onBack: () => void
}

export default function BatchDetail({ batchId, onBack }: BatchDetailProps) {
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)

  // Load batch data when component mounts
  useEffect(() => {
    const loadBatch = async () => {
      try {
        setLoading(true)
        const batchData = await getBatch(batchId)
        if (batchData) {
          setBatch(batchData)
          // Initialize notes with customer email if available
          const initialNotes = batchData.notes || ""
          const emailNote = batchData.customer_email ? `Customer Email: ${batchData.customer_email}` : ""
          const combinedNotes = emailNote && initialNotes ? `${emailNote}\n\n${initialNotes}` : emailNote || initialNotes
          setEditedNotes(combinedNotes)
        } else {
          setError("Batch not found")
        }
      } catch (err) {
        console.error('Error loading batch:', err)
        setError("Failed to load batch details")
      } finally {
        setLoading(false)
      }
    }

    loadBatch()
  }, [batchId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0]
  }

  const getStageStatus = (stage: string) => {
    if (!batch) return "pending"
    const stages = ["put-up", "rack", "filter", "bottle"]
    const currentIndex = stages.indexOf(batch.current_stage)
    const stageIndex = stages.indexOf(stage)

    if (stageIndex < currentIndex) return "completed"
    if (stageIndex === currentIndex) return "current"
    return "pending"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "current":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
    }
  }

  const handleSaveNotes = async () => {
    if (!batch) return
    
    try {
      setNotesLoading(true)
      // Extract customer email from notes if it was added
      const emailPrefix = "Customer Email: "
      const emailLineEnd = editedNotes.indexOf('\n')
      let actualNotes = editedNotes
      
      if (editedNotes.startsWith(emailPrefix)) {
        actualNotes = emailLineEnd > -1 ? editedNotes.substring(emailLineEnd + 2) : ""
      }
      
      await updateBatchNotes(batch.id, actualNotes)
      setBatch(prev => prev ? { ...prev, notes: actualNotes } : null)
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Error saving notes:', error)
      alert("Failed to save notes")
    } finally {
      setNotesLoading(false)
    }
  }

  const handleCancelEditNotes = () => {
    if (!batch) return
    const initialNotes = batch.notes || ""
    const emailNote = batch.customer_email ? `Customer Email: ${batch.customer_email}` : ""
    const combinedNotes = emailNote && initialNotes ? `${emailNote}\n\n${initialNotes}` : emailNote || initialNotes
    setEditedNotes(combinedNotes)
    setIsEditingNotes(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading batch details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !batch) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || "Batch not found"}</p>
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">#{batch.bop_number.toString().padStart(4, '0')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{batch.kit_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Overview */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch Overview</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{batch.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wine className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Wine Kit</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{batch.kit_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{batch.kit_weeks} weeks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        batch.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {batch.status === "completed" ? "Complete" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Production Timeline</h2>
              </div>

              <div className="space-y-6">
                {[
                  { stage: "put-up", label: "Put-Up", date: batch.date_put_up },
                  { stage: "rack", label: "Racking", date: batch.date_rack },
                  { stage: "filter", label: "Filtering", date: batch.date_filter },
                  { stage: "bottle", label: "Bottling", date: batch.date_bottle },
                ].map((item, index) => {
                  const status = getStageStatus(item.stage)
                  return (
                    <div key={item.stage} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : status === "current"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {status === "completed" ? "✓" : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.label}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                            {status === "completed" ? "Done" : status === "current" ? "In Progress" : "Pending"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.date ? formatDate(item.date) : 'Not scheduled'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notes */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
                {!isEditingNotes && (
                  <Button
                    onClick={() => setIsEditingNotes(true)}
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    rows={4}
                    placeholder="Add notes about this batch..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEditNotes} variant="outline" size="sm" className="bg-transparent">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {batch.customer_email && (
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-200 dark:border-blue-800">
                      <strong>Customer Email:</strong> {batch.customer_email}
                    </div>
                  )}
                  <div>{batch.notes || "No additional notes."}</div>
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
