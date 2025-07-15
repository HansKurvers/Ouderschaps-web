import { Container, Title, Text, Card, SimpleGrid, ThemeIcon } from '@mantine/core'
import { IconRocket, IconCode, IconPalette } from '@tabler/icons-react'

export function AboutPage() {
  const features = [
    {
      icon: IconRocket,
      title: 'Snel & Modern',
      description: 'Gebouwd met Vite voor bliksemsnelle ontwikkeling en hot module replacement.',
    },
    {
      icon: IconCode,
      title: 'TypeScript',
      description: 'Volledig getypeerd voor betere code kwaliteit en ontwikkelaarservaring.',
    },
    {
      icon: IconPalette,
      title: 'Mantine UI',
      description: 'Professionele UI componenten met ingebouwde toegankelijkheid.',
    },
  ]

  return (
    <Container>
      <Title order={1} mb="xl">Over Ons</Title>
      
      <Text size="lg" mb="xl">
        Dit is een voorbeeld applicatie die de kracht van moderne web technologieën demonstreert.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {features.map((feature) => (
          <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder>
            <ThemeIcon size={40} radius="md" mb="md">
              <feature.icon size={24} />
            </ThemeIcon>
            <Title order={3} size="h4" mb="sm">
              {feature.title}
            </Title>
            <Text size="sm" c="dimmed">
              {feature.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}