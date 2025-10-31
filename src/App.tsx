import { ThemeProvider } from "@/components/providers/theme-provider"
import { Certificates } from "@/components/certificates"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Certificates/>
      <Toaster position="top-center" richColors/>
    </ThemeProvider>
  )
}

export default App
