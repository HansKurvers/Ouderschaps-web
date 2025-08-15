import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { AuthProvider } from './contexts/AuthContext'
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
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin

  if (!domain || !clientId) {
    return (
      <MantineProvider theme={theme}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Configuration Error</h2>
          <p>Auth0 configuration is missing. Please check your .env file.</p>
        </div>
      </MantineProvider>
    )
  }

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <Auth0Provider
          domain={domain}
          clientId={clientId}
          authorizationParams={{
            redirect_uri: redirectUri,
            audience: audience,
          }}
          cacheLocation="localstorage"
          useRefreshTokens={true}
        >
          <AuthProvider>
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
          </AuthProvider>
        </Auth0Provider>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App