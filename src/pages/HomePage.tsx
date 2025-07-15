import { Container, Title, Text, Button, Group, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Link } from 'react-router-dom'

export function HomePage() {
  const handleClick = () => {
    notifications.show({
      title: 'Welkom!',
      message: 'Bedankt voor het bezoeken van onze website',
      color: 'blue',
    })
  }

  return (
    <Container>
      <Stack gap="xl">
        <div>
          <Title order={1}>Welkom bij Ouderschaps Web</Title>
          <Text size="lg" c="dimmed" mt="md">
            Een moderne React applicatie gebouwd met Vite, TypeScript, Mantine en React Router
          </Text>
        </div>

        <Group>
          <Button onClick={handleClick}>
            Test Notificatie
          </Button>
          <Button component={Link} to="/about" variant="light">
            Meer over ons
          </Button>
        </Group>

        <div>
          <Title order={2} size="h3">Technologieën</Title>
          <Text mt="sm">
            Deze applicatie maakt gebruik van:
          </Text>
          <ul>
            <li>React 19 met TypeScript</li>
            <li>Vite voor snelle development</li>
            <li>Mantine UI voor moderne componenten</li>
            <li>React Router voor navigatie</li>
          </ul>
        </div>
      </Stack>
    </Container>
  )
}