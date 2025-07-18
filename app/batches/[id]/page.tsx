import BatchDetail from "../../../batch-detail"
import { ThemeProvider } from "../../../components/theme-provider"

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BatchDetail batchId={params.id} onBack={() => window.history.back()} />
    </ThemeProvider>
  )
}
