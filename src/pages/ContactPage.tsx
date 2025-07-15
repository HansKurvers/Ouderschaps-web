import { Container, Title, TextInput, Textarea, Button, Paper } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'

interface FormValues {
  name: string
  email: string
  message: string
}

export function ContactPage() {
  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      email: '',
      message: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Naam moet minimaal 2 karakters zijn' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Ongeldig email adres'),
      message: (value) => (value.length < 10 ? 'Bericht moet minimaal 10 karakters zijn' : null),
    },
  })

  const handleSubmit = (values: FormValues) => {
    console.log('Form submitted:', values)
    notifications.show({
      title: 'Bericht verzonden!',
      message: 'We nemen zo snel mogelijk contact met je op.',
      color: 'green',
    })
    form.reset()
  }

  return (
    <Container size="sm">
      <Title order={1} mb="xl">Contact</Title>
      
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Naam"
            placeholder="Je naam"
            required
            mb="md"
            {...form.getInputProps('name')}
          />
          
          <TextInput
            label="Email"
            placeholder="je.email@example.com"
            required
            mb="md"
            {...form.getInputProps('email')}
          />
          
          <Textarea
            label="Bericht"
            placeholder="Je bericht..."
            required
            mb="xl"
            minRows={4}
            {...form.getInputProps('message')}
          />
          
          <Button type="submit" fullWidth>
            Verstuur bericht
          </Button>
        </form>
      </Paper>
    </Container>
  )
}