import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { DossiersPage } from './pages/DossiersPage'
import { DossierFormPage } from './pages/DossierFormPage'
import { ContactenOverzichtPage } from './pages/ContactenOverzichtPage'
import { ContactFormPage } from './pages/ContactFormPage'

const theme = createTheme({
  colors: {
    brand: [
      '#E8F4FB',
      '#C5E5F4',
      '#9FD4ED',
      '#79C3E6',
      '#58B3E5',
      '#3FA3DB',
      '#3492CA',
      '#2D7FB3',
      '#256B9C',
      '#1E5785'
    ]
  },
  primaryColor: 'brand',
  primaryShade: 4,
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
})

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dossiers" replace />} />
            <Route path="dossiers" element={<DossiersPage />} />
            <Route path="dossiers/nieuw" element={<DossierFormPage />} />
            <Route path="dossiers/bewerk/:dossierId" element={<DossierFormPage />} />
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