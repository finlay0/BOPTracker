"use client"

import { useState } from "react"
import { useTheme } from "./components/theme-provider"
import { useRouter } from "next/navigation"
import { useToast } from "./components/toast"
import { PasswordChangeModal } from "./components/password-change-modal"

interface SettingsViewProps {
  wineryAccessCode: string
}

function SettingsView({ wineryAccessCode }: SettingsViewProps) {
  const [userEmail] = useState("sarah@sunsetvalley.com")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { showSuccess, showError } = useToast()

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
      // Simulate logout process
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showSuccess("Logged Out", "You have been successfully logged out.")
      setShowLogoutConfirm(false)
      // In real app, redirect to login
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error) {
      showError("Logout Failed", "Something went wrong")
    }
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      showError("Invalid Email", "Please enter a valid email address")
      return
    }

    setIsEmailChangeLoading(true)

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error("Email already exists"))
          } else {
            resolve(true)
          }
        }, 1500)
      })
      showSuccess("Confirmation Sent", "Check your inbox to finalize the email change.")
      setNewEmail("")
    } catch (error) {
      showError("Email Change Failed", error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsEmailChangeLoading(false)
    }
  }

  const handleOpenUserGuide = () => {
    router.push("/user-guide")
  }

  const handleSupportInputChange = (field: string, value: string) => {
    setSupportForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSupportSubmit = async () => {
    if (!supportForm.message.trim()) {
      showError("Message Required", "Please enter a message")
      return
    }

    setIsSupportLoading(true)

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) {
            reject(new Error("Failed to send"))
          } else {
            resolve(true)
          }
        }, 1500)
      })
      setSupportSent(true)
      setSupportForm({ subject: "", message: "" })
      showSuccess("Message Sent", "We'll get back to you within 24 hours.")
    } catch (error) {
      showError("Send Failed", "Something went wrong")
    } finally {
      setIsSupportLoading(false)
    }
  }

  // Add the PasswordChangeModal before the return statement:
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
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
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
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
                  onClick={handleOpenUserGuide}
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
              <div className="px-6 py-4 flex flex-col gap-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  Log Out
                </button>
                {/* TEMP: Admin Panel Button */}
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] border-2 border-yellow-600"
                >
                  TEMP: Go to Admin Panel
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

export default SettingsView
