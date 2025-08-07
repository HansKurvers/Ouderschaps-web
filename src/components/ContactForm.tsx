import { 
  TextInput, 
  Select, 
  Button, 
  Group, 
  Stack, 
  Grid,
  Divider
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { UseFormReturnType } from '@mantine/form'
import { IconUserPlus, IconDeviceFloppy } from '@tabler/icons-react'
import { Rol } from '../types/api.types'

export interface ContactFormValues {
  roepnaam?: string
  voornamen?: string
  tussenvoegsel?: string
  achternaam: string
  email?: string
  telefoon?: string
  adres?: string
  postcode?: string
  plaats?: string
  rolId?: string
  geboortedatum?: string | Date | null
  geslacht?: string
}

interface ContactFormProps {
  form: UseFormReturnType<ContactFormValues>
  rollen: Rol[]
  onSubmit: (values: ContactFormValues) => Promise<void>
  isEdit?: boolean
  submitting?: boolean
  onCancel?: () => void
  hideRolField?: boolean
  isKind?: boolean
}

export function ContactForm({ 
  form, 
  rollen, 
  onSubmit, 
  isEdit = false, 
  submitting = false,
  onCancel,
  hideRolField = false,
  isKind = false
}: ContactFormProps) {
  
  const handleSubmit = form.onSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Grid>
          <Grid.Col span={4}>
            <TextInput
              label="Roepnaam"
              placeholder="Jan"
              {...form.getInputProps('roepnaam')}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Tussenvoegsel"
              placeholder="van"
              {...form.getInputProps('tussenvoegsel')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              required
              label="Achternaam"
              placeholder="Janssen"
              {...form.getInputProps('achternaam')}
            />
          </Grid.Col>
        </Grid>

        <TextInput
          label="Volledige voornamen"
          placeholder="Jan Willem"
          {...form.getInputProps('voornamen')}
        />

        <Divider label="Persoonlijke gegevens" />
        
        <Grid>
          <Grid.Col span={6}>
            <DateInput
              label="Geboortedatum"
              placeholder="Selecteer datum"
              valueFormat="DD-MM-YYYY"
              {...form.getInputProps('geboortedatum')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Geslacht"
              placeholder="Selecteer geslacht"
              data={[
                { value: 'Man', label: 'Man' },
                { value: 'Vrouw', label: 'Vrouw' },
                { value: 'Anders', label: 'Anders' }
              ]}
              {...form.getInputProps('geslacht')}
            />
          </Grid.Col>
        </Grid>

        {!isKind && (
          <>
            <Divider label="Contactgegevens" />

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="E-mailadres"
                  placeholder="j.janssen@email.com"
                  type="email"
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Telefoonnummer"
                  placeholder="06-12345678"
                  {...form.getInputProps('telefoon')}
                />
              </Grid.Col>
            </Grid>

            <Divider label="Adresgegevens" />

            <TextInput
              label="Adres"
              placeholder="Hoofdstraat 123"
              {...form.getInputProps('adres')}
            />

            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Postcode"
                  placeholder="1234 AB"
                  {...form.getInputProps('postcode')}
                />
              </Grid.Col>
              <Grid.Col span={8}>
                <TextInput
                  label="Plaats"
                  placeholder="Amsterdam"
                  {...form.getInputProps('plaats')}
                />
              </Grid.Col>
            </Grid>
          </>
        )}

        {!hideRolField && (
          <>
            <Divider label="Rol" />
            <Select
              label="Rol"
              placeholder="Selecteer een rol"
              data={rollen.map(rol => ({
                value: String(rol.id),
                label: rol.naam
              }))}
              {...form.getInputProps('rolId')}
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              Annuleren
            </Button>
          )}
          <Button 
            type="submit" 
            loading={submitting}
            leftSection={isEdit ? <IconDeviceFloppy size={16} /> : <IconUserPlus size={16} />}
          >
            {isEdit ? 'Opslaan' : 'Contact toevoegen'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// TODO partij 1 en partij 2 in de frontend contact lijst laten zijn als "partij"