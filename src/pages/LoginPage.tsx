import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Paper, Title, Text, Button, Stack, List, ThemeIcon, Loader, Center } from '@mantine/core'
import { IconLogin, IconCheck, IconFolder, IconUsers, IconFileText } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage = () => {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dossiers', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>Authenticatie controleren...</Text>
        </Stack>
      </Center>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Stack gap="lg">
          <div>
            <Title order={2} mb="xs">
              Welkom bij Ouderschaps
            </Title>
            <Text c="dimmed">
              Log in om uw dossiers en documenten te beheren
            </Text>
          </div>

          <Paper withBorder p="lg" radius="md" bg="gray.0">
            <Stack gap="md">
              <Text fw={500}>Met uw account kunt u:</Text>
              <List
                spacing="sm"
                icon={
                  <ThemeIcon color="teal" size={24} radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <IconFolder size={16} />
                  </ThemeIcon>
                }>
                  Beheer uw dossiers en zaken
                </List.Item>
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <IconUsers size={16} />
                  </ThemeIcon>
                }>
                  Organiseer contactpersonen en relaties
                </List.Item>
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <IconFileText size={16} />
                  </ThemeIcon>
                }>
                  Genereer en beheer documenten
                </List.Item>
              </List>
            </Stack>
          </Paper>

          <Button
            size="lg"
            leftSection={<IconLogin size={20} />}
            onClick={() => login()}
            fullWidth
          >
            Inloggen
          </Button>

          <Text size="sm" c="dimmed" ta="center">
            We gebruiken Auth0 om veilig in te loggen. U wordt doorgestuurd naar een beveiligde inlogpagina.
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}