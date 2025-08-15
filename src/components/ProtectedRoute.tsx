import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
}

export const ProtectedRoute = ({ 
  children, 
  loadingComponent 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>Laden...</Text>
        </Stack>
      </Center>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}