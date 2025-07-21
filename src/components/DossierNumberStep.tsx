import { Stack, Title, TextInput } from '@mantine/core'
import { UseFormReturnType } from '@mantine/form'

interface DossierFormValues {
  dossierNummer: string
}

interface DossierNumberStepProps {
  form: UseFormReturnType<DossierFormValues>
}

export function DossierNumberStep({ form }: DossierNumberStepProps) {
  return (
    <Stack>
      <Title order={3}>Dossier Gegevens</Title>
      <TextInput
        label="Dossiernummer"
        placeholder="Bijvoorbeeld: 12345"
        required
        {...form.getInputProps('dossierNummer')}
      />
    </Stack>
  )
}