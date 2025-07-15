import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Stepper,
  Button,
  Group,
  TextInput,
  Select,
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

interface DossierFormValues {
  naam: string
  status: boolean
}

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

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
  
  const [partij1, setPartij1] = useState<PartijData>({ persoon: null, rolId: '1' })
  const [partij2, setPartij2] = useState<PartijData>({ persoon: null, rolId: '2' })

  const form = useForm<DossierFormValues>({
    initialValues: {
      naam: '',
      status: false // false = actief
    },
    validate: {
      naam: (value) => (value.trim().length < 3 ? 'Naam moet minimaal 3 karakters zijn' : null),
    }
  })

  useEffect(() => {
    loadRollen()
    if (isEdit && dossierId) {
      loadDossier(dossierId)
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
      const dossier = await dossierService.getDossier(id)
      form.setValues({
        naam: dossier.naam || `Dossier ${dossier.dossier_nummer}`,
        status: dossier.status
      })
      
      // Load partijen
      const partijen = await dossierService.getDossierPartijen(id)
      partijen.forEach((partij, index) => {
        if (index === 0 && partij.persoon) {
          setPartij1({ persoon: partij.persoon, rolId: partij.rolId })
        } else if (index === 1 && partij.persoon) {
          setPartij2({ persoon: partij.persoon, rolId: partij.rolId })
        }
      })
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon dossier niet laden',
        color: 'red',
      })
      navigate('/dossiers')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonSelect = (persoon: Persoon) => {
    if (selectingPartij === 1) {
      setPartij1({ ...partij1, persoon })
    } else if (selectingPartij === 2) {
      setPartij2({ ...partij2, persoon })
    }
    setSelectingPartij(null)
  }

  const handleCreateNewPerson = () => {
    // Navigeer naar contact form met return URL
    const returnUrl = isEdit ? `/dossiers/bewerk/${dossierId}` : '/dossiers/nieuw'
    sessionStorage.setItem('returnUrl', returnUrl)
    sessionStorage.setItem('returnStep', String(active))
    navigate('/contacten/nieuw')
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
        return form.isValid()
      case 1:
        return partij1.persoon !== null && partij2.persoon !== null
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      let dossier: Dossier
      
      if (isEdit && dossierId) {
        // Update dossier
        dossier = await dossierService.updateDossier(dossierId, {
          naam: form.values.naam,
          status: form.values.status
        })
      } else {
        // Create new dossier
        dossier = await dossierService.createDossier({
          naam: form.values.naam,
          status: form.values.status
        })
      }
      
      // Add partijen
      const dossierIdToUse = dossier.dossierId || dossier.dossier_nummer
      
      if (partij1.persoon && !isEdit && dossierIdToUse) {
        await dossierService.addDossierPartij(dossierIdToUse, {
          persoonId: partij1.persoon.persoonId,
          rolId: partij1.rolId
        })
      }
      
      if (partij2.persoon && !isEdit && dossierIdToUse) {
        await dossierService.addDossierPartij(dossierIdToUse, {
          persoonId: partij2.persoon.persoonId,
          rolId: partij2.rolId
        })
      }
      
      notifications.show({
        title: isEdit ? 'Dossier bijgewerkt!' : 'Dossier aangemaakt!',
        message: `Dossier "${dossier.naam || `Dossier ${dossier.dossier_nummer}`}" is succesvol ${isEdit ? 'bijgewerkt' : 'aangemaakt'}`,
        color: 'green',
      })
      
      navigate('/dossiers')
    } catch (err) {
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

  const nextStep = () => setActive((current) => (current < 2 ? current + 1 : current))
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

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
        />
        <Stepper.Step 
          label="Stap 2" 
          description="Partijen selecteren"
          allowStepSelect={canProceed(1)}
        />
        <Stepper.Completed>
          <Alert color="green" mb="xl">
            Alle stappen voltooid! Controleer de gegevens en klik op "Opslaan" om het dossier aan te maken.
          </Alert>
        </Stepper.Completed>
      </Stepper>

      <Paper shadow="sm" p="xl" radius="md" withBorder>
        {active === 0 && (
          <Stack>
            <Title order={3}>Dossier Gegevens</Title>
            <TextInput
              label="Dossier naam"
              placeholder="Bijvoorbeeld: Scheiding Familie Jansen"
              required
              {...form.getInputProps('naam')}
            />
            <Select
              label="Status"
              data={[
                { value: 'false', label: 'Actief' },
                { value: 'true', label: 'Inactief' }
              ]}
              value={String(form.values.status)}
              onChange={(value) => form.setFieldValue('status', value === 'true')}
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
            <Title order={3}>Overzicht</Title>
            <Card withBorder p="md">
              <Text fw={500} mb="xs">Dossier gegevens</Text>
              <Text>Naam: {form.values.naam}</Text>
              <Text>Status: {form.values.status}</Text>
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
            disabled={active === 0}
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
          setSelectingPartij(null)
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
    </Container>
  )
}