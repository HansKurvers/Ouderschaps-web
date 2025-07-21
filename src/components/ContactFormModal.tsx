import { useState, useEffect } from 'react'
import { Modal, Alert, Loader, Center } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ContactForm, ContactFormValues } from './ContactForm'
import { persoonService } from '../services/persoon.service'
import { rolService } from '../services/rol.service'
import { Persoon, Rol } from '../types/api.types'
import { getContactFormValidation, transformPostcode } from '../utils/contact.validation'

interface ContactFormModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: (persoon: Persoon) => void
  rolId?: string
  title?: string
}

export function ContactFormModal({ 
  opened, 
  onClose, 
  onSuccess,
  rolId,
  title = 'Nieuw contact toevoegen'
}: ContactFormModalProps) {
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
      rolId: rolId || '1',
      geboortedatum: null,
      geslacht: ''
    },
    transformValues: (values) => ({
      ...values,
      postcode: transformPostcode(values.postcode || '')
    }),
    validate: getContactFormValidation(false) // rolId is not required in modal
  })

  useEffect(() => {
    const loadRollen = async () => {
      try {
        setLoading(true)
        const rollenData = await rolService.getRollen()
        setRollen(rollenData)
      } catch (err) {
        console.error('Error loading rollen:', err)
        setError('Kon rollen niet laden')
      } finally {
        setLoading(false)
      }
    }

    if (opened) {
      loadRollen()
      // Reset form when modal opens
      form.reset()
      if (rolId) {
        form.setFieldValue('rolId', rolId)
      }
    }
  }, [opened, rolId])

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
        geslacht: values.geslacht || undefined,
        geboorteDatum: values.geboortedatum instanceof Date ? values.geboortedatum.toISOString().split('T')[0] : values.geboortedatum || undefined,
      }

      // Maak nieuwe persoon aan
      const resultPersoon = await persoonService.createPersoon(persoonData)
      
      notifications.show({
        title: 'Contact aangemaakt!',
        message: `${resultPersoon.voornamen || ''} ${resultPersoon.achternaam} is succesvol toegevoegd`,
        color: 'green',
      })
      console.log(resultPersoon)
      // Call success callback with the new person
      onSuccess(resultPersoon)
      
      // Close the modal
      onClose()
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

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={title}
      size="lg"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Alert color="red" title="Fout">
          {error}
        </Alert>
      ) : (
        <ContactForm
          form={form}
          rollen={rollen}
          onSubmit={handleSubmit}
          isEdit={false}
          submitting={submitting}
          onCancel={onClose}
          hideRolField={!!rolId}
        />
      )}
    </Modal>
  )
}