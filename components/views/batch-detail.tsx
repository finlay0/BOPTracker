"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, User, Wine, Clock, Edit2, Save, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/utils/supabase/client"
import { updateBatchStageStatus } from "@/lib/batch-utils"

interface BatchDetailProps {
  batchId: string
  onBack: () => void
}

export default function BatchDetail({ batchId, onBack }: BatchDetailProps) {
  const [batch, setBatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingBatch, setIsEditingBatch] = useState(false)
  const [editedBatch, setEditedBatch] = useState<any>({})
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [editedDates, setEditedDates] = useState<any>({})
  const [validationErrors, setValidationErrors] = useState<any>({})

  // Load batch data from backend
  useEffect(() => {
    const loadBatch = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('id', batchId)
          .single()

        if (error) {
          console.error('Error loading batch:', error)
          setError('Failed to load batch details')
          return
        }

        if (!data) {
          setError('Batch not found')
          return
        }

        setBatch(data)
        setEditedBatch({ ...data })
        setEditedDates({
          put_up_date: data.put_up_date,
          rack_date: data.rack_date,
          filter_date: data.filter_date,
          bottle_date: data.bottle_date
        })
        
        // Combine notes with customer email if available
        let notesContent = data.notes || ""
        if (data.customer_email) {
          notesContent = `Customer Email: ${data.customer_email}\n\n${notesContent}`.trim()
        }
        setEditedNotes(notesContent)
        
      } catch (error) {
        console.error('Error loading batch:', error)
        setError('Failed to load batch details')
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

  const getCurrentStageLabel = (batch: any) => {
    if (batch.status === 'done') return 'completed'
    if (!batch.put_up_completed) return 'put-up'
    if (!batch.rack_completed) return 'rack'
    if (!batch.filter_completed) return 'filter'
    if (!batch.bottle_completed) return 'bottle'
    return 'completed'
  }

  const getStageStatus = (stage: string) => {
    if (!batch) return 'pending'
    
    const stageCompleted = batch[`${stage.replace('-', '_')}_completed`]
    const currentStage = getCurrentStageLabel(batch)
    
    if (stageCompleted) return 'completed'
    if (currentStage === stage) return 'current'
    return 'pending'
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

  const validateDates = (dates: any) => {
    const errors: any = {}
    
    const putUpDate = new Date(dates.put_up_date)
    const rackDate = new Date(dates.rack_date)
    const filterDate = new Date(dates.filter_date)
    const bottleDate = new Date(dates.bottle_date)

    if (rackDate <= putUpDate) {
      errors.rack_date = "Racking date must be after put-up date"
    }
    if (filterDate <= rackDate) {
      errors.filter_date = "Filtering date must be after racking date"
    }
    if (bottleDate <= filterDate) {
      errors.bottle_date = "Bottling date must be after filtering date"
    }

    return errors
  }

  const handleMarkStageComplete = async (stage: string) => {
    try {
      const stageKey = stage.replace('-', '_')
      const isCompleted = batch[`${stageKey}_completed`]
      
      await updateBatchStageStatus(batchId, stageKey as any, !isCompleted)
      
      // Update local state
      setBatch((prev: any) => ({
        ...prev,
        [`${stageKey}_completed`]: !isCompleted
      }))

      alert(`${stage} stage ${!isCompleted ? 'completed' : 'unmarked'}!`)
    } catch (error) {
      console.error('Error updating stage:', error)
      alert('Failed to update stage status')
    }
  }

  const handleEditBatch = () => {
    setEditedBatch({ ...batch })
    setIsEditingBatch(true)
  }

  const handleEditDates = () => {
    setEditedDates({
      put_up_date: batch.put_up_date,
      rack_date: batch.rack_date,
      filter_date: batch.filter_date,
      bottle_date: batch.bottle_date
    })
    setIsEditingDates(true)
    setValidationErrors({})
  }

  const handleSaveBatchEdit = async () => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({
          customer: editedBatch.customer,
          wine_kit: editedBatch.wine_kit,
          kit_weeks: editedBatch.kit_weeks,
          status: editedBatch.status
        })
        .eq('id', batchId)

      if (error) {
        console.error('Error updating batch:', error)
        alert('Failed to update batch')
        return
      }

      setBatch(editedBatch)
      setIsEditingBatch(false)
      alert("Batch updated successfully!")
    } catch (error) {
      console.error('Error updating batch:', error)
      alert('Failed to update batch')
    }
  }

  const handleSaveDates = async () => {
    const errors = validateDates(editedDates)
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      const { error } = await supabase
        .from('batches')
        .update(editedDates)
        .eq('id', batchId)

      if (error) {
        console.error('Error updating dates:', error)
        alert('Failed to update dates')
        return
      }

      setBatch((prev: any) => ({ ...prev, ...editedDates }))
      setIsEditingDates(false)
      setValidationErrors({})
      alert("Dates updated successfully!")
    } catch (error) {
      console.error('Error updating dates:', error)
      alert('Failed to update dates')
    }
  }

  const handleCancelBatchEdit = () => {
    setEditedBatch({ ...batch })
    setIsEditingBatch(false)
  }

  const handleCancelDatesEdit = () => {
    setEditedDates({
      put_up_date: batch.put_up_date,
      rack_date: batch.rack_date,
      filter_date: batch.filter_date,
      bottle_date: batch.bottle_date
    })
    setIsEditingDates(false)
    setValidationErrors({})
  }

  const handleBatchInputChange = (field: string, value: string | number) => {
    setEditedBatch((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleDateInputChange = (field: string, value: string) => {
    setEditedDates((prev: any) => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev: any) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleDeleteBatch = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId)

      if (error) {
        console.error('Error deleting batch:', error)
        alert('Failed to delete batch')
        return
      }

      alert("Batch deleted successfully!")
      setShowDeleteConfirm(false)
      onBack() // Go back to batches list
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Failed to delete batch')
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleSaveNotes = async () => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ notes: editedNotes })
        .eq('id', batchId)

      if (error) {
        console.error('Error updating notes:', error)
        alert('Failed to save notes')
        return
      }

      setBatch((prev: any) => ({ ...prev, notes: editedNotes }))
      setIsEditingNotes(false)
      alert("Notes saved successfully!")
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to save notes')
    }
  }

  const handleCancelEditNotes = () => {
    let notesContent = batch.notes || ""
    if (batch.customer_email) {
      notesContent = `Customer Email: ${batch.customer_email}\n\n${notesContent}`.trim()
    }
    setEditedNotes(notesContent)
    setIsEditingNotes(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 lg:pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading batch details...</p>
            </div>
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
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">{error || 'Batch not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const canMarkComplete = batch.status !== 'done'

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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">#{batch.bop_number}</h1>
            <p className="text-gray-600 dark:text-gray-400">{batch.wine_kit}</p>
            {batch.customer_email && (
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{batch.customer_email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Overview */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch Overview</h2>
                {!isEditingBatch && (
                  <Button onClick={handleEditBatch} variant="outline" size="sm" className="bg-transparent">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditingBatch ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Customer
                      </label>
                      <input
                        type="text"
                        value={editedBatch.customer}
                        onChange={(e) => handleBatchInputChange("customer", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Wine Kit
                      </label>
                      <input
                        type="text"
                        value={editedBatch.wine_kit}
                        onChange={(e) => handleBatchInputChange("wine_kit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Duration (weeks)
                      </label>
                      <select
                        value={editedBatch.kit_weeks}
                        onChange={(e) => handleBatchInputChange("kit_weeks", Number.parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value={4}>4 weeks</option>
                        <option value={5}>5 weeks</option>
                        <option value={6}>6 weeks</option>
                        <option value={8}>8 weeks</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</label>
                      <select
                        value={editedBatch.status}
                        onChange={(e) => handleBatchInputChange("status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="pending">In Progress</option>
                        <option value="done">Complete</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveBatchEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelBatchEdit} variant="outline" className="bg-transparent">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{batch.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wine className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Wine Kit</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{batch.wine_kit}</p>
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
                          batch.status === "done"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}
                      >
                        {batch.status === "done" ? "Complete" : "In Progress"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Timeline */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Production Timeline</h2>
                {!isEditingDates && (
                  <Button onClick={handleEditDates} variant="outline" size="sm" className="bg-transparent">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Dates
                  </Button>
                )}
              </div>

              {isEditingDates ? (
                <div className="space-y-4">
                  {[
                    { stage: "put_up_date", label: "Put-Up Date" },
                    { stage: "rack_date", label: "Racking Date" },
                    { stage: "filter_date", label: "Filtering Date" },
                    { stage: "bottle_date", label: "Bottling Date" },
                  ].map((item) => (
                    <div key={item.stage}>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {item.label}
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(editedDates[item.stage])}
                        onChange={(e) => handleDateInputChange(item.stage, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      {validationErrors[item.stage] && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors[item.stage]}</p>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveDates} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Save Dates
                    </Button>
                    <Button onClick={handleCancelDatesEdit} variant="outline" className="bg-transparent">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { stage: "put-up", label: "Put-Up", date: batch.put_up_date },
                    { stage: "rack", label: "Racking", date: batch.rack_date },
                    { stage: "filter", label: "Filtering", date: batch.filter_date },
                    { stage: "bottle", label: "Bottling", date: batch.bottle_date },
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
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(item.date)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                    rows={6}
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
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {editedNotes || "No notes added yet."}
                </div>
              )}
            </Card>

            {/* Actions */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stage Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleMarkStageComplete("put-up")} 
                  variant={batch.put_up_completed ? "outline" : "default"}
                  className={`w-full ${batch.put_up_completed ? 'bg-transparent text-green-600 border-green-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {batch.put_up_completed ? "✓ Put-Up Complete" : "Mark Put-Up Complete"}
                </Button>
                <Button 
                  onClick={() => handleMarkStageComplete("rack")} 
                  variant={batch.rack_completed ? "outline" : "default"}
                  className={`w-full ${batch.rack_completed ? 'bg-transparent text-green-600 border-green-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {batch.rack_completed ? "✓ Racking Complete" : "Mark Racking Complete"}
                </Button>
                <Button 
                  onClick={() => handleMarkStageComplete("filter")} 
                  variant={batch.filter_completed ? "outline" : "default"}
                  className={`w-full ${batch.filter_completed ? 'bg-transparent text-green-600 border-green-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {batch.filter_completed ? "✓ Filtering Complete" : "Mark Filtering Complete"}
                </Button>
                <Button 
                  onClick={() => handleMarkStageComplete("bottle")} 
                  variant={batch.bottle_completed ? "outline" : "default"}
                  className={`w-full ${batch.bottle_completed ? 'bg-transparent text-green-600 border-green-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {batch.bottle_completed ? "✓ Bottling Complete" : "Mark Bottling Complete"}
                </Button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleDeleteBatch}
                  variant="outline"
                  className="w-full text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-400 dark:hover:border-red-500 bg-transparent"
                >
                  Delete Batch
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Batch</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete batch #{batch.bop_number} for {batch.customer}? This action cannot be
                undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
