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
import { Persoon, AddKindData, DossierKind } from '../types/api.types'
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
  const { kinderen, loading, addKind, removeKind, getKindIds, reload } = useDossierKinderen(dossierId)
  const [showPersonenModal, setShowPersonenModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingKind, setEditingKind] = useState<DossierKind | null>(null)

  const handleSelectKind = async (persoon: Persoon) => {
    try {
      const kindId = persoon.persoonId || persoon.id || persoon._id
      
      const data: AddKindData = {
        kindId: String(kindId),
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
      const kindId = persoon.persoonId || persoon.id || persoon._id
      
      const data: AddKindData = {
        kindId: String(kindId),
        ouderRelaties: [] // Tijdelijk leeg
      }
      await addKind(data)
      setShowContactModal(false)
      setEditingKind(null)
    } catch (error) {
      console.error('Failed to add kind:', error)
    }
  }

  const handleEditKind = (dossierKind: DossierKind) => {
    setEditingKind(dossierKind)
    setShowContactModal(true)
  }

  const handleUpdateKind = async (updatedPersoon: Persoon) => {
    // The persoon is already updated in the backend via the modal
    setShowContactModal(false)
    setEditingKind(null)
    
    // Reload the kinderen to show the updated data immediately
    await reload()
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
        {kinderen.map((kind) => {
          return (
            <Grid.Col key={kind.id} span={{ base: 12, md: 6 }}>
              <KindCard
                dossierKind={kind}
                onRemove={() => removeKind(String(kind.id))}
                onEdit={handleEditKind}
              />
            </Grid.Col>
          )
        })}
        
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
        title="Selecteer een kind"
      />

      <ContactFormModal
        opened={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setEditingKind(null)
        }}
        onSuccess={editingKind ? handleUpdateKind : handleCreateKind}
        title={editingKind ? "Kind aanpassen" : "Nieuw kind toevoegen"}
        isKind={true}
        persoon={editingKind?.kind}
      />
    </Stack>
  )
}