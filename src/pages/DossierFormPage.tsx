import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Stepper,
  Button,
  Group,
  TextInput,
  Paper,
  Stack,
  Text,
  Card,
  Badge,
  Alert,
  Modal
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconTrash, IconUserPlus, IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { dossierService } from '../services/dossier.service'
import { rolService } from '../services/rol.service'
import { Dossier, Persoon, Rol } from '../types/api.types'
import { PersonenSelectModal } from '../components/PersonenSelectModal'
import { ContactFormModal } from '../components/ContactFormModal'

interface DossierFormValues {
  dossierNummer: string
}

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

// Feature flag: enable loading existing dossier data
const ENABLE_DOSSIER_LOADING = true

export function DossierFormPage() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const isEdit = !!dossierId
  
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectModalOpen, setSelectModalOpen] = useState(false)
  const [selectingPartij, setSelectingPartij] = useState<1 | 2 | null>(null)
  const [rollen, setRollen] = useState<Rol[]>([])
  const [newContactModalOpen, setNewContactModalOpen] = useState(false)
  const [newContactPartij, setNewContactPartij] = useState<1 | 2 | null>(null)
  
  const [partij1, setPartij1] = useState<PartijData>({ persoon: null, rolId: '1' })
  const [partij2, setPartij2] = useState<PartijData>({ persoon: null, rolId: '2' })

  const form = useForm<DossierFormValues>({
    initialValues: {
      dossierNummer: ''
    },
    validate: {
      dossierNummer: (value) => {
        if (!value || value.trim().length === 0) return 'Dossiernummer is verplicht'
        if (!/^\d+$/.test(value)) return 'Dossiernummer moet een getal zijn'
        return null
      }
    }
  })

  useEffect(() => {
    loadRollen()
    if (isEdit && dossierId) {
      loadDossier(dossierId)
      // Skip dossier number step in edit mode
      setActive(1)
    }
  }, [isEdit, dossierId])

  const loadRollen = async () => {
    try {
      const data = await rolService.getRollen()
      setRollen(data)
    } catch (err) {
      console.error('Error loading rollen:', err)
    }
  }

  const loadDossier = async (id: string) => {
    try {
      setLoading(true)
      
      if (ENABLE_DOSSIER_LOADING) { 
        // Probeer het dossier op te halen
        const dossier = await dossierService.getDossier(id)
        
        // Zet de form values
        form.setValues({
          dossierNummer: dossier.dossierNummer || dossier.dossier_nummer || ''
        })
        
        // Probeer de partijen op te halen
        try {
          const partijen = await dossierService.getDossierPartijen(id)
          
          // Map de partijen naar partij1 en partij2
          if (partijen && partijen.length > 0) {
            const partij1Data = partijen.find(p => p.rol?.naam === 'Partij 1' || p.rolId === '1')
            const partij2Data = partijen.find(p => p.rol?.naam === 'Partij 2' || p.rolId === '2')
            
            if (partij1Data && partij1Data.persoon) {
              setPartij1({ persoon: partij1Data.persoon, rolId: partij1Data.rolId })
            }
            if (partij2Data && partij2Data.persoon) {
              setPartij2({ persoon: partij2Data.persoon, rolId: partij2Data.rolId })
            }
          }
        } catch (partijErr) {
          console.error('Error loading partijen:', partijErr)
          // Don't show notification for partijen loading errors in edit mode
          // The user can still edit the dossier number and other details
        }
      } else {
        // Voor edit mode kunnen we het dossiernummer niet weten zonder de API
        form.setValues({
          dossierNummer: ''
        })
        
        notifications.show({
          title: 'Let op',
          message: 'Dossier data laden is tijdelijk uitgeschakeld.',
          color: 'yellow',
        })
      }
    } catch (err) {
      console.error('Error loading dossier:', err)
      notifications.show({
        title: 'Fout',
        message: err instanceof Error ? err.message : 'Kon dossier niet laden',
        color: 'red',
      })
      navigate('/dossiers')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonSelect = (persoon: Persoon) => {
    console.log('Person selected:', persoon, 'for partij:', selectingPartij)
    
    if (selectingPartij === 1) {
      const newPartij1 = { ...partij1, persoon }
      setPartij1(newPartij1)
    } else if (selectingPartij === 2) {
      const newPartij2 = { ...partij2, persoon }
      setPartij2(newPartij2)
    }
    
    // Reset selectingPartij na succesvol selecteren
    setSelectingPartij(null)
  }

  const handleCreateNewPerson = () => {
    console.log('Opening new contact modal for partij:', selectingPartij)
    // Sla op voor welke partij we een nieuw contact maken
    setNewContactPartij(selectingPartij)
    // Open de modal voor nieuw contact in plaats van navigeren
    setSelectModalOpen(false)
    setNewContactModalOpen(true)
  }
  
  const handleNewContactSuccess = (persoon: Persoon) => {
    console.log('New contact created:', persoon)
    console.log('Adding to partij:', newContactPartij)
    
    // Voeg de nieuwe persoon toe aan de juiste partij
    if (newContactPartij === 1) {
      console.log('Setting partij1 with new person')
      setPartij1({ ...partij1, persoon })
    } else if (newContactPartij === 2) {
      console.log('Setting partij2 with new person')
      setPartij2({ ...partij2, persoon })
    }
    
    // Reset states en sluit modal
    setNewContactPartij(null)
    setSelectingPartij(null)
    setNewContactModalOpen(false)
  }

  const getVolledigeNaam = (persoon: Persoon) => {
    const delen = [
      persoon.roepnaam || persoon.voornamen,
      persoon.tussenvoegsel,
      persoon.achternaam
    ].filter(Boolean)
    return delen.join(' ')
  }

  const canProceed = (step: number) => {
    switch (step) {
      case 0:
        // In edit mode, always allow proceeding since dossier number is disabled
        // In create mode, validate the form
        return isEdit ? true : form.isValid()
      case 1:
        return partij1.persoon !== null && partij2.persoon !== null
      case 2:
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      let dossier: Dossier
      
      if (isEdit && dossierId) {
        // Update dossier - get existing dossier data since dossierNummer cannot be updated
        dossier = await dossierService.getDossier(dossierId)
        
        
        // First, get existing partijen to compare
        try {
          const existingPartijen = await dossierService.getDossierPartijen(dossierId)
          
          const existingPartij1 = existingPartijen.find(p => p.rol?.naam === 'Partij 1' || p.rolId === '1')
          const existingPartij2 = existingPartijen.find(p => p.rol?.naam === 'Partij 2' || p.rolId === '2')
          
          
          // Remove old partijen if they exist
          if (existingPartij1) {
            const partij1Id = existingPartij1.dossierPartijId || existingPartij1._id || (existingPartij1 as any).id
            if (partij1Id) {
              await dossierService.removeDossierPartij(dossierId, partij1Id)
            } else {
              console.error('No valid ID found for existingPartij1')
            }
          }
          if (existingPartij2) {
            const partij2Id = existingPartij2.dossierPartijId || existingPartij2._id || (existingPartij2 as any).id
            if (partij2Id) {
              await dossierService.removeDossierPartij(dossierId, partij2Id)
            } else {
              console.error('No valid ID found for existingPartij2')
            }
          }
          
          // Add new partijen
          if (partij1.persoon) {

            // Check if persoonId exists, fallback to id
            const persoonId = partij1.persoon.persoonId || (partij1.persoon.id ? String(partij1.persoon.id) : null)
            
            if (!persoonId) {
              console.error('No persoonId found for partij1:', partij1.persoon)
              throw new Error('Persoon ID is required')
            }
            
            await dossierService.addDossierPartij(dossierId, {
              persoonId: persoonId,
              rolId: parseInt(partij1.rolId || '1')
            })
          }
          
          if (partij2.persoon) {
            // Check if persoonId exists, fallback to id
            const persoonId = partij2.persoon.persoonId || (partij2.persoon.id ? String(partij2.persoon.id) : null)
            
            if (!persoonId) {
              console.error('No persoonId found for partij2:', partij2.persoon)
              throw new Error('Persoon ID is required')
            }
            
            await dossierService.addDossierPartij(dossierId, {
              persoonId: persoonId,
              rolId: parseInt(partij2.rolId || '2')
            })
          }
          
        } catch (partijErr) {
          console.error('Error updating partijen:', partijErr)
          console.error('Error details:', {
            error: partijErr,
            partij1: partij1,
            partij2: partij2,
            dossierId: dossierId
          })
          notifications.show({
            title: 'Waarschuwing',
            message: 'Dossier bijgewerkt, maar er was een probleem met het bijwerken van partijen',
            color: 'yellow',
          })
        }
        
        const dossierNummer = dossier.dossierNummer || dossier.dossier_nummer || form.values.dossierNummer || dossierId
        notifications.show({
          title: 'Dossier bijgewerkt!',
          message: `Dossier ${dossierNummer} is succesvol bijgewerkt`,
          color: 'green',
        })
      } else {
        // Create new dossier
        dossier = await dossierService.createDossier({
          dossierNummer: form.values.dossierNummer
        })
        
        // Add partijen alleen voor nieuwe dossiers
        const dossierIdToUse = String(dossier.id) // Gebruik het database ID
        
        if (partij1.persoon && dossierIdToUse) {
          
          const persoonId = partij1.persoon.persoonId || (partij1.persoon.id ? String(partij1.persoon.id) : null)
          if (!persoonId) {
            console.error('No persoonId found for partij1 in new dossier:', partij1.persoon)
            throw new Error('Persoon ID is required for partij 1')
          }
          
          await dossierService.addDossierPartij(dossierIdToUse, {
            persoonId: persoonId,
            rolId: parseInt(partij1.rolId || '1')
          })
        }
        
        if (partij2.persoon && dossierIdToUse) {
          
          const persoonId = partij2.persoon.persoonId || (partij2.persoon.id ? String(partij2.persoon.id) : null)
          if (!persoonId) {
            console.error('No persoonId found for partij2 in new dossier:', partij2.persoon)
            throw new Error('Persoon ID is required for partij 2')
          }
          
          await dossierService.addDossierPartij(dossierIdToUse, {
            persoonId: persoonId,
            rolId: parseInt(partij2.rolId || '2')
          })
        }
        
        notifications.show({
          title: 'Dossier aangemaakt!',
          message: `Dossier ${dossier.dossierNummer || dossier.dossier_nummer} is succesvol aangemaakt`,
          color: 'green',
        })
      }
      
      navigate('/dossiers')
    } catch (err) {
      console.error('Error submitting dossier:', err)
      notifications.show({
        title: 'Fout',
        message: err instanceof Error ? err.message : 'Er is een fout opgetreden',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!dossierId) return
    
    try {
      setLoading(true)
      await dossierService.deleteDossier(dossierId)
      notifications.show({
        title: 'Dossier verwijderd',
        message: 'Het dossier is succesvol verwijderd',
        color: 'green',
      })
      navigate('/dossiers')
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon dossier niet verwijderen',
        color: 'red',
      })
    } finally {
      setLoading(false)
      setDeleteModalOpen(false)
    }
  }

  const nextStep = () => {
    setActive((current) => current < 3 ? current + 1 : current)
  }
  
  const prevStep = () => {
    setActive((current) => {
      // In edit mode, don't go below step 1 (partijen selection)
      const minStep = isEdit ? 1 : 0
      return current > minStep ? current - 1 : current
    })
  }

  return (
    <Container>
      <Group justify="space-between" mb="xl">
        <Title order={1}>{isEdit ? 'Dossier Bewerken' : 'Nieuw Dossier'}</Title>
        {isEdit && (
          <Button 
            color="red" 
            variant="light"
            leftSection={<IconTrash size={20} />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Verwijderen
          </Button>
        )}
      </Group>

      <Stepper active={active} onStepClick={setActive} mb="xl">
        <Stepper.Step 
          label="Stap 1" 
          description="Dossier gegevens"
          allowStepSelect={canProceed(0)}
          disabled={isEdit}
        />
        <Stepper.Step 
          label="Stap 2" 
          description="Partijen selecteren"
          allowStepSelect={canProceed(1)}
        />
        <Stepper.Step 
          label="Stap 3" 
          description="Controle & Overzicht"
          allowStepSelect={canProceed(2)}
        />
        <Stepper.Completed>
          <Alert color="green" mb="xl">
            {isEdit 
              ? 'Controleer de gegevens en klik op "Opslaan" om het dossier bij te werken.'
              : 'Alle stappen voltooid! Controleer de gegevens en klik op "Dossier Aanmaken" om het dossier aan te maken.'
            }
          </Alert>
        </Stepper.Completed>
      </Stepper>

      <Paper shadow="sm" p="xl" radius="md" withBorder>
        {active === 0 && (
          <Stack>
            <Title order={3}>Dossier Gegevens</Title>
            <TextInput
              label="Dossiernummer"
              placeholder="Bijvoorbeeld: 12345"
              required
              {...form.getInputProps('dossierNummer')}
            />
          </Stack>
        )}

        {active === 1 && (
          <Stack>
            <Title order={3}>Selecteer Partijen</Title>
            
            {/* Partij 1 */}
            <div>
              <Text fw={500} mb="sm">Partij 1</Text>
              {partij1.persoon ? (
                <Card withBorder p="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{getVolledigeNaam(partij1.persoon)}</Text>
                      <Text size="sm" c="dimmed">{partij1.persoon.email || 'Geen email'}</Text>
                      <Badge mt="xs">{rollen.find(r => String(r.id) === partij1.rolId)?.naam || 'Partij 1'}</Badge>
                    </div>
                    <Button
                      variant="light"
                      onClick={() => {
                        setSelectingPartij(1)
                        setSelectModalOpen(true)
                      }}
                    >
                      Wijzig persoon
                    </Button>
                  </Group>
                </Card>
              ) : (
                <Button
                  leftSection={<IconUserPlus size={20} />}
                  onClick={() => {
                    setSelectingPartij(1)
                    setSelectModalOpen(true)
                  }}
                >
                  Selecteer persoon voor Partij 1
                </Button>
              )}
            </div>

            {/* Partij 2 */}
            <div>
              <Text fw={500} mb="sm">Partij 2</Text>
              {partij2.persoon ? (
                <Card withBorder p="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{getVolledigeNaam(partij2.persoon)}</Text>
                      <Text size="sm" c="dimmed">{partij2.persoon.email || 'Geen email'}</Text>
                      <Badge mt="xs">{rollen.find(r => String(r.id) === partij2.rolId)?.naam || 'Partij 2'}</Badge>
                    </div>
                    <Button
                      variant="light"
                      onClick={() => {
                        setSelectingPartij(2)
                        setSelectModalOpen(true)
                      }}
                    >
                      Wijzig persoon
                    </Button>
                  </Group>
                </Card>
              ) : (
                <Button
                  leftSection={<IconUserPlus size={20} />}
                  onClick={() => {
                    setSelectingPartij(2)
                    setSelectModalOpen(true)
                  }}
                >
                  Selecteer persoon voor Partij 2
                </Button>
              )}
            </div>
          </Stack>
        )}

        {active === 2 && (
          <Stack>
            <Title order={3}>Controle & Overzicht</Title>
            <Card withBorder p="md">
              <Text fw={500} mb="xs">Dossier gegevens</Text>
              <Text>Dossiernummer: {form.values.dossierNummer}</Text>
              {partij1.persoon && partij2.persoon && (
                <Text mt="xs" fw={500}>
                  {getVolledigeNaam(partij1.persoon)} & {getVolledigeNaam(partij2.persoon)}
                </Text>
              )}
            </Card>
            
            <Card withBorder p="md">
              <Text fw={500} mb="xs">Partij 1</Text>
              {partij1.persoon ? (
                <>
                  <Text>{getVolledigeNaam(partij1.persoon)}</Text>
                  <Text size="sm" c="dimmed">{partij1.persoon.email || 'Geen email'}</Text>
                </>
              ) : (
                <Text c="dimmed">Niet geselecteerd</Text>
              )}
            </Card>
            
            <Card withBorder p="md">
              <Text fw={500} mb="xs">Partij 2</Text>
              {partij2.persoon ? (
                <>
                  <Text>{getVolledigeNaam(partij2.persoon)}</Text>
                  <Text size="sm" c="dimmed">{partij2.persoon.email || 'Geen email'}</Text>
                </>
              ) : (
                <Text c="dimmed">Niet geselecteerd</Text>
              )}
            </Card>
          </Stack>
        )}

        <Group justify="space-between" mt="xl">
          <Button 
            variant="default" 
            onClick={prevStep}
            disabled={active === (isEdit ? 1 : 0)}
            leftSection={<IconArrowLeft size={16} />}
          >
            Vorige
          </Button>
          
          {active === 2 ? (
            <Button onClick={handleSubmit} loading={loading}>
              {isEdit ? 'Opslaan' : 'Dossier Aanmaken'}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={!canProceed(active)}
              rightSection={<IconArrowRight size={16} />}
            >
              Volgende
            </Button>
          )}
        </Group>
      </Paper>

      <PersonenSelectModal
        opened={selectModalOpen}
        onClose={() => {
          setSelectModalOpen(false)
          // NIET selectingPartij resetten hier - we hebben het misschien nog nodig voor nieuwe contact
        }}
        onSelect={handlePersonSelect}
        onCreateNew={handleCreateNewPerson}
        excludeIds={[partij1.persoon?.persoonId, partij2.persoon?.persoonId].filter(Boolean) as string[]}
        title={`Selecteer persoon voor ${selectingPartij === 1 ? 'Partij 1' : 'Partij 2'}`}
      />

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Dossier verwijderen"
      >
        <Text mb="md">
          Weet je zeker dat je dit dossier wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Annuleren
          </Button>
          <Button color="red" onClick={handleDelete} loading={loading}>
            Verwijderen
          </Button>
        </Group>
      </Modal>

      <ContactFormModal
        opened={newContactModalOpen}
        onClose={() => {
          setNewContactModalOpen(false)
          setNewContactPartij(null)
          setSelectingPartij(null)
        }}
        onSuccess={handleNewContactSuccess}
        rolId={newContactPartij === 1 ? '1' : newContactPartij === 2 ? '2' : '1'}
        title={newContactPartij ? `Nieuw contact toevoegen voor ${newContactPartij === 1 ? 'Partij 1' : 'Partij 2'}` : 'Nieuw contact toevoegen'}
      />
    </Container>
  )
}