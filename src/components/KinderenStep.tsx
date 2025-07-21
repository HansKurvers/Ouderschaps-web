import { useState } from 'react'
import {
  Button,
  Group,
  Stack,
  Text,
  Grid,
  Card
} from '@mantine/core'
import { IconUserPlus } from '@tabler/icons-react'
import { Persoon, AddKindData } from '../types/api.types'
import { PersonenSelectModal } from './PersonenSelectModal'
import { ContactFormModal } from './ContactFormModal'
import { KindCard } from './KindCard'
import { useDossierKinderen } from '../hooks/useDossierKinderen'

interface KinderenStepProps {
  dossierId?: string
  partijen: { persoon: Persoon | null, rolId: string }[]
  onNext: () => void
  onBack: () => void
}

export function KinderenStep({ dossierId, onNext, onBack }: KinderenStepProps) {
  const { kinderen, loading, addKind, removeKind, getKindIds } = useDossierKinderen(dossierId)
  const [showPersonenModal, setShowPersonenModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const handleSelectKind = async (persoon: Persoon) => {
    try {
      const data: AddKindData = {
        kindId: persoon.persoonId,
        ouderRelaties: [] // Tijdelijk leeg
      }
      await addKind(data)
      setShowPersonenModal(false)
    } catch (error) {
      console.error('Failed to add kind:', error)
    }
  }

  const handleCreateKind = async (persoon: Persoon) => {
    try {
      const data: AddKindData = {
        kindId: persoon.persoonId,
        ouderRelaties: [] // Tijdelijk leeg
      }
      await addKind(data)
      setShowContactModal(false)
    } catch (error) {
      console.error('Failed to add kind:', error)
    }
  }


  return (
    <Stack>
      <div>
        <Text size="xl" fw={700} mb="md">Stap 3: Kinderen toevoegen</Text>
        <Text c="dimmed" mb="xl">
          Voeg kinderen toe aan dit dossier.
        </Text>
      </div>


      <Grid>
        {kinderen.map((kind) => (
          <Grid.Col key={kind.dossierKindId} span={{ base: 12, md: 6 }}>
            <KindCard
              dossierKind={kind}
              onRemove={() => removeKind(kind.dossierKindId)}
            />
          </Grid.Col>
        ))}
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="xl" style={{ border: '2px dashed var(--mantine-color-gray-4)' }}>
            <Stack align="center">
              <IconUserPlus size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed">Voeg een kind toe</Text>
              <Button
                onClick={() => setShowPersonenModal(true)}
                loading={loading}
              >
                Selecteer kind
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

  
      <PersonenSelectModal
        opened={showPersonenModal}
        onClose={() => setShowPersonenModal(false)}
        onSelect={handleSelectKind}
        onCreateNew={() => {
          setShowPersonenModal(false)
          setShowContactModal(true)
        }}
        excludeIds={getKindIds()}
        title="Selecteer een kind"
      />

      <ContactFormModal
        opened={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSuccess={handleCreateKind}
        title="Nieuw kind toevoegen"
        isKind={true}
      />
    </Stack>
  )
}