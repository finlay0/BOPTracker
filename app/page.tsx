import BOPTracker from "../bop-tracker"
import { ThemeProvider } from "../components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BOPTracker />
    </ThemeProvider>
  )
}
