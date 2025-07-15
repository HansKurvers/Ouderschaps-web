import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { DossiersPage } from './pages/DossiersPage'
import { ContactenOverzichtPage } from './pages/ContactenOverzichtPage'
import { ContactFormPage } from './pages/ContactFormPage'

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
})

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="dossiers" element={<DossiersPage />} />
            <Route path="contacten" element={<ContactenOverzichtPage />} />
            <Route path="contacten/nieuw" element={<ContactFormPage />} />
            <Route path="contacten/bewerk/:persoonId" element={<ContactFormPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App