export default function UserGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-gray-900">🍷 BOP Tracker – User Guide</h1>

        <section className="space-y-6">
          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">1️⃣ Logging In</h2>
            <p>
              Use your email and password to log in to your winery’s private dashboard. If you forget your password,
              contact your administrator or use the reset option.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">2️⃣ Adding Your First Batch</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to the <strong>“New”</strong> tab.
              </li>
              <li>Fill in Customer Name, Wine Kit Name, Kit Duration, and Date of Sale.</li>
              <li>
                Specify whether the kit is already put up. If not, choose a future put-up date. The system automatically
                calculates racking, filtering, and bottling dates.
              </li>
            </ol>
            <p className="mt-4">
              Tap <em>Save Batch</em> to create it.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">3️⃣ Viewing and Completing Today’s Tasks</h2>
            <p>
              The <strong>Today</strong> page groups everything that needs doing. Tap “Mark as Done” to complete a task.
              When all tasks are done you’ll see a quick celebration 🎉.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">4️⃣ Navigating Between Days</h2>
            <p>
              Use the arrows at the top of the Today page to browse past or future days. Tap <em>Back to Today</em> to
              return.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">5️⃣ Viewing All Batches</h2>
            <p>
              The <strong>Batches</strong> tab lets you search, filter, sort, and edit every batch. Click a BOP # to see
              full details.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">6️⃣ Batch Detail View</h2>
            <p>
              See the complete schedule, notes, and status. Override any date if schedules change — today’s task list
              updates automatically.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">7️⃣ Settings &amp; Support</h2>
            <p>
              Change your password, switch themes, open this guide, or send a support message from the
              <strong>Settings</strong> tab.
            </p>
          </article>

          <article className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 leading-relaxed">
            <h2 className="text-xl font-medium mb-4">🧠 Tips</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>No need to delete batches — mark them complete.</li>
              <li>Use notes for customer-specific requests.</li>
              <li>You can reschedule any stage in the Batch Detail view.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}
