import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n.ts'
import { ThemeProvider } from './components/theme-provider.tsx'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme"> 
     <div dir="rtl" className="font-sans">
       <App />
       <Toaster position='top-center' />
     </div>
    </ThemeProvider>
  </StrictMode>,
)
