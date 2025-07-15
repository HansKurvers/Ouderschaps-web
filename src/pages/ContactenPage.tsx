import { useState, useEffect } from 'react'
import { 
  Container, 
  Title, 
  Paper, 
  TextInput, 
  Select, 
  Button, 
  Group, 
  Stack, 
  Alert,
  Loader,
  Grid,
  Divider
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconUserPlus } from '@tabler/icons-react'
import { persoonService } from '../services/persoon.service'
import { rolService } from '../services/rol.service'
import { Persoon, Rol } from '../types/api.types'

interface ContactFormValues {
  voornamen: string
  tussenvoegsel: string
  achternaam: string
  email: string
  telefoon: string
  adres: string
  postcode: string
  plaats: string
  rolId: string
}

export function ContactenPage() {
  const [rollen, setRollen] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ContactFormValues>({
    initialValues: {
      voornamen: '',
      tussenvoegsel: '',
      achternaam: '',
      email: '',
      telefoon: '',
      adres: '',
      postcode: '',
      plaats: '',
      rolId: '',
    },
    validate: {
      achternaam: (value) => (value.trim().length < 2 ? 'Achternaam is verplicht' : null),
      email: (value) => {
        if (!value) return null // Email is optioneel
        return /^\S+@\S+$/.test(value) ? null : 'Ongeldig email adres'
      },
      rolId: (value) => (!value ? 'Selecteer een rol' : null),
    },
  })

  useEffect(() => {
    loadRollen()
  }, [])

  const loadRollen = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await rolService.getRollen()
      setRollen(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het laden van rollen')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: ContactFormValues) => {
    try {
      setSubmitting(true)
      
      // Maak persoon data object
      const persoonData: Partial<Persoon> = {
        voornamen: values.voornamen,
        tussenvoegsel: values.tussenvoegsel || undefined,
        achternaam: values.achternaam,
        email: values.email || undefined,
        telefoon: values.telefoon || undefined,
        adres: values.adres || undefined,
        postcode: values.postcode || undefined,
        plaats: values.plaats || undefined,
      }

      // Maak de persoon aan
      const nieuwePersoon = await persoonService.createPersoon(persoonData)
      
      const selectedRol = rollen.find(r => String(r.id) === values.rolId)
      //TODO los huisnummer veld voor validatie en api
      notifications.show({
        title: 'Contact aangemaakt!',
        message: `${nieuwePersoon.voornamen || ''} ${nieuwePersoon.achternaam} is toegevoegd als ${selectedRol?.naam || 'contact'}`,
        color: 'green',
      })
      
      // Reset het formulier
      form.reset()
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: err instanceof Error ? err.message : 'Er is een fout opgetreden',
        color: 'red',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Alert title="Fout" color="red" mt="md">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      <Title order={1} mb="xl">Nieuwe Contact Toevoegen</Title>
      
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Divider label="Persoonlijke gegevens" labelPosition="center" />
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Voornamen"
                  placeholder="Jan Willem"
                  {...form.getInputProps('voornamen')}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 2 }}>
                <TextInput
                  label="Tussenvoegsel"
                  placeholder="van der"
                  {...form.getInputProps('tussenvoegsel')}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Achternaam"
                  placeholder="Berg"
                  required
                  {...form.getInputProps('achternaam')}
                />
              </Grid.Col>
            </Grid>

            <Select
              label="Rol"
              placeholder="Selecteer een rol"
              required
              data={rollen.map(rol => ({
                value: String(rol.id),
                label: rol.naam
              }))}
              {...form.getInputProps('rolId')}
            />

            <Divider label="Contact gegevens" labelPosition="center" mt="md" />

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Email"
                  placeholder="email@example.com"
                  type="email"
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Telefoon"
                  placeholder="06-12345678"
                  {...form.getInputProps('telefoon')}
                />
              </Grid.Col>
            </Grid>

            <Divider label="Adres gegevens" labelPosition="center" mt="md" />

            <TextInput
              label="Adres"
              placeholder="Hoofdstraat 123"
              {...form.getInputProps('adres')}
            />

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Postcode"
                  placeholder="1234 AB"
                  {...form.getInputProps('postcode')}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label="Plaats"
                  placeholder="Amsterdam"
                  {...form.getInputProps('plaats')}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="xl">
              <Button 
                type="submit" 
                loading={submitting}
                leftSection={<IconUserPlus size={20} />}
              >
                Contact Toevoegen
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}