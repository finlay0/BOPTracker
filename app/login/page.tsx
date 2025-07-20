import LoginPage from "../../login-page"
import { ThemeProvider } from "../../components/theme-provider"

export default function Login() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LoginPage />
    </ThemeProvider>
  )
}
