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
import { IconUserPlus, IconDeviceFloppy } from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
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

export function ContactFormPage() {
  const { persoonId } = useParams()
  const navigate = useNavigate()
  const isEdit = !!persoonId
  
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
    if (isEdit && persoonId) {
      loadPersoon(persoonId)
    }
  }, [isEdit, persoonId])

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

  const loadPersoon = async (id: string) => {
    try {
      const persoon = await persoonService.getPersoon(id)
      form.setValues({
        voornamen: persoon.voornamen || '',
        tussenvoegsel: persoon.tussenvoegsel || '',
        achternaam: persoon.achternaam,
        email: persoon.email || '',
        telefoon: persoon.telefoon || '',
        adres: persoon.adres || '',
        postcode: persoon.postcode || '',
        plaats: persoon.plaats || '',
        rolId: '1', // TODO: Get actual role from dossier partij
      })
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon contact niet laden',
        color: 'red',
      })
      navigate('/contacten')
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

      let resultPersoon: Persoon
      
      if (isEdit && persoonId) {
        // Update bestaande persoon
        resultPersoon = await persoonService.updatePersoon(persoonId, persoonData)
        notifications.show({
          title: 'Contact bijgewerkt!',
          message: `${resultPersoon.voornamen || ''} ${resultPersoon.achternaam} is succesvol bijgewerkt`,
          color: 'green',
        })
      } else {
        // Maak nieuwe persoon aan
        resultPersoon = await persoonService.createPersoon(persoonData)
        const selectedRol = rollen.find(r => String(r.id) === values.rolId)
        notifications.show({
          title: 'Contact aangemaakt!',
          message: `${resultPersoon.voornamen || ''} ${resultPersoon.achternaam} is toegevoegd als ${selectedRol?.naam || 'contact'}`,
          color: 'green',
        })
      }
      
      // Navigeer terug naar overzicht
      navigate('/contacten')
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
      <Title order={1} mb="xl">{isEdit ? 'Contact Bewerken' : 'Nieuwe Contact Toevoegen'}</Title>
      
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
                leftSection={isEdit ? <IconDeviceFloppy size={20} /> : <IconUserPlus size={20} />}
              >
                {isEdit ? 'Opslaan' : 'Contact Toevoegen'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}