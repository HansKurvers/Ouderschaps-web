import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Stepper,
  Button,
  Group,
  Paper,
  Alert,
  Modal,
  Text,
  rem,
  Box
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconTrash, IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { dossierService } from '../services/dossier.service'
import { rolService } from '../services/rol.service'
import { Persoon, Rol } from '../types/api.types'
import { PersonenSelectModal } from '../components/PersonenSelectModal'
import { ContactFormModal } from '../components/ContactFormModal'
import { DossierNumberStep } from '../components/DossierNumberStep'
import { PartijSelectStep } from '../components/PartijSelectStep'
import { KinderenStep } from '../components/KinderenStep'
import { DossierOverviewStep } from '../components/DossierOverviewStep'
import { OmgangsregelingStep, OmgangsregelingStepHandle } from '../components/OmgangsregelingStep'
import { VakantiesStep, VakantiesStepHandle } from '../components/ZorgRegelingen/VakantiesStep'
import { FeestdagenStep, FeestdagenStepHandle } from '../components/ZorgRegelingen/FeestdagenStep'
import { BijzondereDagenStep, BijzondereDagenStepHandle } from '../components/ZorgRegelingen/BijzondereDagenStep'
import { BeslissingenStep, BeslissingenStepHandle } from '../components/ZorgRegelingen/BeslissingenStep'
import { useDossierPartijen } from '../hooks/useDossierPartijen'
import { loadDossierData, getDossierNummer } from '../utils/dossierHelpers'
import { submitDossier } from '../utils/dossierSubmit'
import { createDossierWithPartijen } from '../utils/dossierCreate'
import { useDossierKinderen } from '../hooks/useDossierKinderen'

interface DossierFormValues {
  dossierNummer: string
}

// Feature flag: enable loading existing dossier data
const ENABLE_DOSSIER_LOADING = true

export function DossierFormPage() {
  const { dossierId: paramDossierId } = useParams()
  const navigate = useNavigate()
  const [dossierId, setDossierId] = useState<string | undefined>(paramDossierId)
  const isEdit = !!dossierId
  
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectModalOpen, setSelectModalOpen] = useState(false)
  const [selectingPartij, setSelectingPartij] = useState<1 | 2 | null>(null)
  const [rollen, setRollen] = useState<Rol[]>([])
  const [newContactModalOpen, setNewContactModalOpen] = useState(false)
  const [newContactPartij, setNewContactPartij] = useState<1 | 2 | null>(null)
  const [editContactModalOpen, setEditContactModalOpen] = useState(false)
  const [editingPartij, setEditingPartij] = useState<1 | 2 | null>(null)
  
  const omgangsregelingRef = useRef<OmgangsregelingStepHandle>(null)
  const vakantiesRef = useRef<VakantiesStepHandle>(null)
  const feestdagenRef = useRef<FeestdagenStepHandle>(null)
  const bijzondereDagenRef = useRef<BijzondereDagenStepHandle>(null)
  const beslissingenRef = useRef<BeslissingenStepHandle>(null)
  
  // Responsive breakpoints for stepper
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  
  const {
    partij1,
    partij2,
    setPartij1,
    setPartij2,
    setPartijPersoon,
    getVolledigeNaam,
    getExcludeIds
  } = useDossierPartijen()

  const { kinderen } = useDossierKinderen(dossierId)

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
    if (paramDossierId) {
      loadDossier(paramDossierId)
      // Open at step 9 (overview) when opening a finished document
      setActive(8)
    }
  }, [paramDossierId])

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
      
      if (!ENABLE_DOSSIER_LOADING) {
        form.setValues({ dossierNummer: '' })
        notifications.show({
          title: 'Let op',
          message: 'Dossier data laden is tijdelijk uitgeschakeld.',
          color: 'yellow',
        })
        return
      }

      const { dossier, partijen, error } = await loadDossierData(id)
      
      if (error || !dossier) {
        notifications.show({
          title: 'Fout',
          message: error?.message || 'Kon dossier niet laden',
          color: 'red',
        })
        navigate('/dossiers')
        return
      }
      
      form.setValues({ dossierNummer: getDossierNummer(dossier) })
      
      // Map de partijen naar partij1 en partij2
      const partij1Data = partijen.find(p => p.rol?.naam === 'Partij 1' || p.rolId === '1')
      const partij2Data = partijen.find(p => p.rol?.naam === 'Partij 2' || p.rolId === '2')
      
      if (partij1Data?.persoon) {
        setPartij1({ persoon: partij1Data.persoon, rolId: partij1Data.rolId })
      }
      if (partij2Data?.persoon) {
        setPartij2({ persoon: partij2Data.persoon, rolId: partij2Data.rolId })
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePersonSelect = (persoon: Persoon) => {
    // Person selected for partij
    
    if (selectingPartij) {
      setPartijPersoon(selectingPartij, persoon)
    }
    
    // Reset selectingPartij na succesvol selecteren
    setSelectingPartij(null)
  }

  const handleCreateNewPerson = () => {
    // Opening new contact modal
    // Sla op voor welke partij we een nieuw contact maken
    setNewContactPartij(selectingPartij)
    // Open de modal voor nieuw contact in plaats van navigeren
    setSelectModalOpen(false)
    setNewContactModalOpen(true)
  }
  
  const handleNewContactSuccess = (persoon: Persoon) => {
    // New contact created and added to partij
    
    // Voeg de nieuwe persoon toe aan de juiste partij
    if (newContactPartij === 1) {
      // Setting partij1 with new person
      setPartij1({ ...partij1, persoon })
    } else if (newContactPartij === 2) {
      // Setting partij2 with new person
      setPartij2({ ...partij2, persoon })
    }
    
    // Reset states en sluit modal
    setNewContactPartij(null)
    setSelectingPartij(null)
    setNewContactModalOpen(false)
  }

  const handleEditPartij = (partijNumber: 1 | 2) => {
    setEditingPartij(partijNumber)
    setEditContactModalOpen(true)
  }

  const handleEditContactSuccess = (persoon: Persoon) => {
    // Contact updated
    if (editingPartij === 1) {
      setPartij1({ ...partij1, persoon })
    } else if (editingPartij === 2) {
      setPartij2({ ...partij2, persoon })
    }
    
    // Reset states and close modal
    setEditingPartij(null)
    setEditContactModalOpen(false)
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
        return true // Kinderen step - always allow proceeding
      case 3:
        return true // Omgangsregeling step
      case 4:
        return true // Vakanties step
      case 5:
        return true // Overview step
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Save all step data if we're on or past that step
      if (dossierId) {
        if (omgangsregelingRef.current) {
          await omgangsregelingRef.current.saveData()
        }
        if (vakantiesRef.current) {
          await vakantiesRef.current.saveData()
        }
        if (feestdagenRef.current) {
          await feestdagenRef.current.saveData()
        }
        if (bijzondereDagenRef.current) {
          await bijzondereDagenRef.current.saveData()
        }
        if (beslissingenRef.current) {
          await beslissingenRef.current.saveData()
        }
      }
      
      // For edit mode, update the dossier
      if (isEdit) {
        const result = await submitDossier({
          isEdit: true,
          dossierId,
          dossierNummer: form.values.dossierNummer,
          partij1,
          partij2
        })
        
        if (result.success) {
          notifications.show({
            title: 'Dossier bijgewerkt!',
            message: result.message,
            color: result.message.includes('probleem') ? 'yellow' : 'green',
          })
          navigate('/dossiers')
        } else {
          notifications.show({
            title: 'Fout',
            message: result.message,
            color: 'red',
          })
        }
      } else {
        // For new dossiers, just navigate back (dossier was already created)
        navigate('/dossiers')
      }
    } catch (error) {
      console.error('Error submitting dossier:', error)
      notifications.show({
        title: 'Fout',
        message: 'Er is een fout opgetreden bij het opslaan',
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

  const nextStep = async () => {
    // Save step data before moving to next step
    if (dossierId) {
      try {
        if (active === 3 && omgangsregelingRef.current) {
          await omgangsregelingRef.current.saveData()
        } else if (active === 4 && vakantiesRef.current) {
          await vakantiesRef.current.saveData()
        } else if (active === 5 && feestdagenRef.current) {
          await feestdagenRef.current.saveData()
        } else if (active === 6 && bijzondereDagenRef.current) {
          await bijzondereDagenRef.current.saveData()
        } else if (active === 7 && beslissingenRef.current) {
          await beslissingenRef.current.saveData()
        }
      } catch (error) {
        console.error('Error saving step data:', error)
        return // Don't proceed to next step if save fails
      }
    }
    
    // After step 2 (partijen), create the dossier if it's new
    if (active === 1 && !isEdit && partij1.persoon && partij2.persoon) {
      setLoading(true)
      try {
        const result = await createDossierWithPartijen({
          dossierNummer: form.values.dossierNummer,
          partij1,
          partij2
        })
        
        if (result.success && result.dossierId) {
          setDossierId(result.dossierId)
          // Removed notification - intermediate step, not critical
          setActive((current) => current + 1)
        } else {
          notifications.show({
            title: 'Fout',
            message: result.message,
            color: 'red'
          })
        }
      } catch (error) {
        notifications.show({
          title: 'Fout',
          message: 'Kon dossier niet aanmaken',
          color: 'red'
        })
      } finally {
        setLoading(false)
      }
    } else {
      // Save omgang data when moving from step 3 to 4
      if (active === 3 && dossierId && omgangsregelingRef.current) {
        try {
          setLoading(true)
          await omgangsregelingRef.current.saveData()
        } catch (error) {
          console.error('Error saving omgang data:', error)
          notifications.show({
            title: 'Fout',
            message: 'Kon omgangsregeling niet opslaan',
            color: 'red'
          })
          return
        } finally {
          setLoading(false)
        }
      }
      
      // Save vakantie data when moving from step 4 to 5
      if (active === 4 && dossierId && vakantiesRef.current) {
        try {
          setLoading(true)
          await vakantiesRef.current.saveData()
        } catch (error) {
          console.error('Error saving vakantie data:', error)
          notifications.show({
            title: 'Fout',
            message: 'Kon vakantieregelingen niet opslaan',
            color: 'red'
          })
          return
        } finally {
          setLoading(false)
        }
      }
      
      // Save feestdagen data when moving from step 5 to 6
      if (active === 5 && dossierId && feestdagenRef.current) {
        try {
          setLoading(true)
          await feestdagenRef.current.saveData()
        } catch (error) {
          console.error('Error saving feestdagen data:', error)
          notifications.show({
            title: 'Fout',
            message: 'Kon feestdagenregelingen niet opslaan',
            color: 'red'
          })
          return
        } finally {
          setLoading(false)
        }
      }
      
      // Save bijzondere dagen data when moving from step 6 to 7
      if (active === 6 && dossierId && bijzondereDagenRef.current) {
        try {
          setLoading(true)
          await bijzondereDagenRef.current.saveData()
        } catch (error) {
          console.error('Error saving bijzondere dagen data:', error)
          notifications.show({
            title: 'Fout',
            message: 'Kon bijzondere dagen regelingen niet opslaan',
            color: 'red'
          })
          return
        } finally {
          setLoading(false)
        }
      }
      
      setActive((current) => current < 8 ? current + 1 : current)
    }
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

      <Box 
        mb="xl" 
        style={{ 
          overflowX: 'auto',
          overflowY: 'visible',
          paddingBottom: rem(4)
        }}
      >
        <Stepper 
          active={active} 
          onStepClick={setActive}
          size="xs"
          orientation={isMobile ? "vertical" : "horizontal"}
          styles={{
            root: {
              minWidth: isMobile ? undefined : 'max-content',
            },
            content: {
              paddingTop: rem(0),
            },
            separator: {
              marginLeft: rem(0),
              marginRight: rem(0),
              minWidth: rem(5),
              maxWidth: rem(15),
            },
            step: {
              padding: rem(2),
              minWidth: 'auto',
            },
            stepIcon: {
              width: rem(28),
              height: rem(28),
              minWidth: rem(28),
              fontSize: rem(12),
            },
            stepBody: {
              marginTop: rem(2),
              marginLeft: rem(4),
              minWidth: 0,
            },
            stepLabel: {
              fontSize: rem(11),
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            },
            stepDescription: {
              display: isTablet ? 'none' : 'block',
              fontSize: rem(10),
              marginTop: rem(1),
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }
          }}
        >
        <Stepper.Step 
          label="Dossier" 
          description={isMobile ? undefined : "Gegevens"}
          allowStepSelect={canProceed(0)}
          disabled={isEdit}
        />
        <Stepper.Step 
          label="Partijen" 
          description={isMobile ? undefined : "Selecteren"}
          allowStepSelect={canProceed(1)}
        />
        <Stepper.Step 
          label="Kinderen" 
          description={isMobile ? undefined : "Toevoegen"}
          allowStepSelect={canProceed(2)}
        />
        <Stepper.Step 
          label="Omgang" 
          description={isMobile ? undefined : "Regeling"}
          allowStepSelect={canProceed(3)}
        />
        <Stepper.Step 
          label="Vakanties" 
          description={isMobile ? undefined : "Regelingen"}
          allowStepSelect={canProceed(4)}
        />
        <Stepper.Step 
          label="Feestdagen" 
          description={isMobile ? undefined : "Regelingen"}
          allowStepSelect={canProceed(5)}
        />
        <Stepper.Step 
          label="Bijzonder" 
          description={isMobile ? undefined : "Dagen"}
          allowStepSelect={canProceed(6)}
        />
        <Stepper.Step 
          label="Beslissingen" 
          description={isMobile ? undefined : "Overig"}
          allowStepSelect={canProceed(7)}
        />
        <Stepper.Step 
          label="Controle" 
          description={isMobile ? undefined : "Overzicht"}
          allowStepSelect={canProceed(8)}
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
    </Box>

      <Paper shadow="sm" p="xl" radius="md" withBorder>
        {active === 0 && (
          <DossierNumberStep form={form} />
        )}

        {active === 1 && (
          <PartijSelectStep
            partij1={partij1}
            partij2={partij2}
            rollen={rollen}
            onSelectPartij={(partijNumber) => {
              setSelectingPartij(partijNumber)
              setSelectModalOpen(true)
            }}
            onEditPartij={handleEditPartij}
            getVolledigeNaam={getVolledigeNaam}
          />
        )}

        {active === 2 && (
          <KinderenStep
            dossierId={dossierId}
            partijen={[partij1, partij2]}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {active === 3 && (
          <OmgangsregelingStep
            ref={omgangsregelingRef}
            dossierId={dossierId}
            partij1={partij1}
            partij2={partij2}
          />
        )}

        {active === 4 && (
          <VakantiesStep
            ref={vakantiesRef}
            dossierId={dossierId}
            kinderen={kinderen}
            partij1={partij1}
            partij2={partij2}
          />
        )}

        {active === 5 && (
          <FeestdagenStep
            ref={feestdagenRef}
            dossierId={dossierId}
            kinderen={kinderen}
            partij1={partij1}
            partij2={partij2}
          />
        )}

        {active === 6 && (
          <BijzondereDagenStep
            ref={bijzondereDagenRef}
            dossierId={dossierId}
            kinderen={kinderen}
            partij1={partij1}
            partij2={partij2}
          />
        )}

        {active === 7 && (
          <BeslissingenStep
            ref={beslissingenRef}
            dossierId={dossierId}
            kinderen={kinderen}
            partij1={partij1}
            partij2={partij2}
          />
        )}

        {active === 8 && (
          <DossierOverviewStep
            dossierNummer={form.values.dossierNummer}
            partij1={partij1}
            partij2={partij2}
            kinderen={kinderen}
            getVolledigeNaam={getVolledigeNaam}
            dossierId={dossierId}
          />
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
          
          {active === 8 ? (
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
        excludeIds={getExcludeIds()}
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

      <ContactFormModal
        opened={editContactModalOpen}
        onClose={() => {
          setEditContactModalOpen(false)
          setEditingPartij(null)
        }}
        onSuccess={handleEditContactSuccess}
        persoon={(editingPartij === 1 ? partij1.persoon : editingPartij === 2 ? partij2.persoon : null) || undefined}
        rolId={editingPartij === 1 ? partij1.rolId : editingPartij === 2 ? partij2.rolId : '1'}
        title={editingPartij ? `Contact bewerken voor ${editingPartij === 1 ? 'Partij 1' : 'Partij 2'}` : 'Contact bewerken'}
      />
    </Container>
  )
}