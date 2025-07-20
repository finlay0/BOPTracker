"use client"

import { useState } from "react"
import { ArrowLeft, Calendar, User, Wine, Clock, Edit2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface BatchDetailProps {
  batchId: string
  onBack: () => void
}

export default function BatchDetail({ batchId, onBack }: BatchDetailProps) {
  // Sample batch data - in real app this would come from API
  const [batch, setBatch] = useState({
    id: batchId,
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
    notes: "Customer requested extra clarification time",
  })

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState(batch.notes)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingBatch, setIsEditingBatch] = useState(false)
  const [editedBatch, setEditedBatch] = useState({ ...batch })

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
    const stages = ["put-up", "rack", "filter", "bottle"]
    const currentIndex = stages.indexOf(batch.currentStage)
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

  const handleMarkStageComplete = () => {
    const stages = ["put-up", "rack", "filter", "bottle", "completed"]
    const currentIndex = stages.indexOf(batch.currentStage)

    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1]
      setBatch((prev) => ({
        ...prev,
        currentStage: nextStage,
        status: nextStage === "completed" ? "done" : "pending",
      }))

      // Show success message
      alert(
        `Stage marked as complete! ${nextStage === "completed" ? "Batch is now finished." : `Next stage: ${nextStage}`}`,
      )
    }
  }

  const handleEditBatch = () => {
    setEditedBatch({ ...batch })
    setIsEditingBatch(true)
  }

  const handleSaveBatchEdit = () => {
    setBatch(editedBatch)
    setIsEditingBatch(false)
    alert("Batch updated successfully!")
  }

  const handleCancelBatchEdit = () => {
    setEditedBatch({ ...batch })
    setIsEditingBatch(false)
  }

  const handleBatchInputChange = (field: string, value: string | number) => {
    setEditedBatch((prev) => ({ ...prev, [field]: value }))
  }

  const handleDeleteBatch = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    // This would typically call an API to delete the batch
    alert("Batch deleted successfully!")
    setShowDeleteConfirm(false)
    onBack() // Go back to batches list
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleSaveNotes = () => {
    setBatch((prev) => ({ ...prev, notes: editedNotes }))
    setIsEditingNotes(false)
    // In real app, this would save to backend
    alert("Notes saved successfully!")
  }

  const handleCancelEditNotes = () => {
    setEditedNotes(batch.notes)
    setIsEditingNotes(false)
  }

  const canMarkComplete = batch.currentStage !== "completed"

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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{batch.bopNumber}</h1>
            <p className="text-gray-600 dark:text-gray-400">{batch.wineKit}</p>
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
                        value={editedBatch.wineKit}
                        onChange={(e) => handleBatchInputChange("wineKit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Duration (weeks)
                      </label>
                      <select
                        value={editedBatch.kitWeeks}
                        onChange={(e) => handleBatchInputChange("kitWeeks", Number.parseInt(e.target.value))}
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
                      <p className="font-medium text-gray-900 dark:text-gray-100">{batch.wineKit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{batch.kitWeeks} weeks</p>
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
                {!isEditingBatch && (
                  <Button onClick={handleEditBatch} variant="outline" size="sm" className="bg-transparent">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Dates
                  </Button>
                )}
              </div>

              {isEditingBatch ? (
                <div className="space-y-4">
                  {[
                    { stage: "putUp", label: "Put-Up Date" },
                    { stage: "rack", label: "Racking Date" },
                    { stage: "filter", label: "Filtering Date" },
                    { stage: "bottle", label: "Bottling Date" },
                  ].map((item) => (
                    <div key={item.stage}>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {item.label}
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(editedBatch[item.stage as keyof typeof editedBatch] as string)}
                        onChange={(e) => handleBatchInputChange(item.stage, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { stage: "put-up", label: "Put-Up", date: batch.putUp },
                    { stage: "rack", label: "Racking", date: batch.rack },
                    { stage: "filter", label: "Filtering", date: batch.filter },
                    { stage: "bottle", label: "Bottling", date: batch.bottle },
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{batch.notes || "No notes added yet."}</p>
              )}
            </Card>

            {/* Actions */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
              <div className="space-y-3">
                {canMarkComplete && (
                  <Button onClick={handleMarkStageComplete} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Mark Current Stage Complete
                  </Button>
                )}
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
                Are you sure you want to delete batch {batch.bopNumber} for {batch.customer}? This action cannot be
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
