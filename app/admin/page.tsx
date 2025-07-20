import AdminPanel from "../../admin-panel"
import { ThemeProvider } from "../../components/theme-provider"

export default function Admin() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AdminPanel />
    </ThemeProvider>
  )
}
