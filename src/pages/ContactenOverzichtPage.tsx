import { useState, useEffect } from 'react'
import { 
  Container, 
  Title, 
  Table, 
  Button, 
  Group, 
  TextInput,
  Select,
  Paper,
  ActionIcon,
  Loader,
  Alert,
  Text,
  Badge,
  Menu,
  Modal
} from '@mantine/core'
import { IconPlus, IconEdit, IconSearch, IconSortAscending, IconSortDescending, IconTrash, IconDots } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { persoonService } from '../services/persoon.service'
import { dossierService } from '../services/dossier.service'
import { Persoon } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

type SortField = 'naam' | 'rol'
type SortOrder = 'asc' | 'desc'

interface PersoonWithDossiers extends Persoon {
  dossiers?: string[]
}

// Mock data voor nu, later vervangen met echte dossier partijen data
const mockRollen: Record<string, string> = {
  '1': 'Partij 1',
  '2': 'Partij 2',
  '3': 'Advocaat',
  '4': 'Mediator'
}

export function ContactenOverzichtPage() {
  const navigate = useNavigate()
  const [personen, setPersonen] = useState<PersoonWithDossiers[]>([])
  const [filteredPersonen, setFilteredPersonen] = useState<PersoonWithDossiers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('naam')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [persoonToDelete, setPersoonToDelete] = useState<PersoonWithDossiers | null>(null)

  useEffect(() => {
    loadPersonen()
  }, [])

  useEffect(() => {
    filterAndSortPersonen()
  }, [personen, searchQuery, sortField, sortOrder])

  const loadPersonen = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Probeer eerst personen op te halen
      let personenData = await persoonService.getPersonen()
      
      // Als we geen personen krijgen, probeer via dossiers
      if (personenData.length === 0) {
        // Haal eerste dossier op om partijen te kunnen ophalen
        const dossiers = await dossierService.getDossiers()
        if (dossiers.length > 0) {
          const dossierId = dossiers[0].dossierId || dossiers[0].dossier_nummer || String(dossiers[0].id)
          const partijen = await dossierService.getDossierPartijen(dossierId)
          // Extract personen uit partijen
          personenData = partijen
            .filter(p => p.persoon)
            .map(p => p.persoon!)
            .filter(p => p.persoonId) // Extra check voor persoonId
        }
      }
      
      // Now fetch all dossiers to see which contacts appear in which dossiers
      // Get ALL dossiers including inactive ones and with higher limit
      let allDossiers: any[] = []
      try {
        // getDossiers already returns the array directly (it handles the response.data)
        allDossiers = await dossierService.getDossiers({ 
          includeInactive: true,
          limit: 100  // Get more dossiers
        })
      } catch (err) {
        console.error('Failed to load dossiers:', err)
        allDossiers = []
      }
      
      const personenWithDossiers: PersoonWithDossiers[] = []
      
      // Create a map to track dossiers per person
      const persoonDossiersMap = new Map<string, Set<string>>()
      
      // For each dossier, get the parties and track which persons are in it
      for (const dossier of allDossiers) {
        try {
          // Use the actual database ID for API calls, not the dossier number
          const dossierId = dossier.id
          const dossierNummer = dossier.dossierNummer || dossier.dossier_nummer || dossier.dossierId
          
          if (!dossierId) {
            console.warn('Dossier without ID:', dossier)
            continue
          }
          
          const partijen = await dossierService.getDossierPartijen(String(dossierId))
          
          
          for (const partij of partijen) {
            if (partij.persoon) {
              // Try multiple ways to get the person ID since the structure might vary
              const persoonId = partij.persoon.persoonId?.toString() || 
                               partij.persoon.id?.toString() || 
                               partij.persoon._id?.toString() ||
                               partij.persoonId?.toString() // Sometimes persoonId is directly on partij
              
       
              if (persoonId) {
                if (!persoonDossiersMap.has(persoonId)) {
                  persoonDossiersMap.set(persoonId, new Set())
                }
                persoonDossiersMap.get(persoonId)!.add(dossierNummer)
              }
            }
          }
        } catch (err) {
          console.error(`Failed to load partijen for dossier:`, err)
        }
      }
      
      
      // Add dossier information to each person
      for (const persoon of personenData) {
        // Match the same ID extraction pattern used when building the map
        const persoonId = persoon.persoonId?.toString() || 
                         persoon.id?.toString() || 
                         persoon._id?.toString()
        
        const dossierSet = persoonDossiersMap.get(persoonId || '')
        
        personenWithDossiers.push({
          ...persoon,
          dossiers: dossierSet ? Array.from(dossierSet) : []
        })
      }
      
      setPersonen(personenWithDossiers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }


  const filterAndSortPersonen = () => {
    let filtered = [...personen]

    // Filter op zoekterm
    if (searchQuery) {
      filtered = filtered.filter(persoon => {
        const volledigeNaam = getVolledigeNaam(persoon).toLowerCase()
        return volledigeNaam.includes(searchQuery.toLowerCase())
      })
    }

    // Sorteer
    filtered.sort((a, b) => {
      let compareValue = 0
      
      if (sortField === 'naam') {
        compareValue = a.achternaam.localeCompare(b.achternaam)
      } else if (sortField === 'rol') {
        // Voor nu sorteren we op ID, later op echte rol
        compareValue = (a._id || '').localeCompare(b._id || '')
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredPersonen(filtered)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleDeleteClick = (persoon: PersoonWithDossiers) => {
    setPersoonToDelete(persoon)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!persoonToDelete) return
    
    const persoonId = persoonToDelete.id?.toString() || persoonToDelete.persoonId || persoonToDelete._id
    
    if (!persoonId) {
      notifications.show({
        title: 'Fout',
        message: 'Kan persoon ID niet vinden',
        color: 'red'
      })
      return
    }
    
    try {
      await persoonService.deletePersoon(persoonId)
      
      notifications.show({
        title: 'Contact verwijderd',
        message: `${getVolledigeNaam(persoonToDelete)} is succesvol verwijderd`,
        color: 'green'
      })
      
      // Reload de personen lijst
      await loadPersonen()
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon contact niet verwijderen',
        color: 'red'
      })
    } finally {
      setDeleteModalOpen(false)
      setPersoonToDelete(null)
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
      <Group justify="space-between" mb="xl">
        <Title order={1}>Contacten</Title>
        <Button 
          leftSection={<IconPlus size={20} />}
          onClick={() => navigate('/contacten/nieuw')}
        >
          Nieuw Contact
        </Button>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Zoek op naam..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Sorteer op"
            data={[
              { value: 'naam', label: 'Achternaam' },
              { value: 'rol', label: 'Rol' }
            ]}
            value={sortField}
            onChange={(value) => setSortField(value as SortField)}
            style={{ width: 150 }}
          />
          <ActionIcon 
            variant="light" 
            onClick={() => toggleSort(sortField)}
            size="lg"
          >
            {sortOrder === 'asc' ? <IconSortAscending size={20} /> : <IconSortDescending size={20} />}
          </ActionIcon>
        </Group>
      </Paper>

      {filteredPersonen.length === 0 ? (
        <Paper p="xl" withBorder>
          <Text ta="center" c="dimmed">
            {searchQuery ? 'Geen contacten gevonden met deze zoekcriteria.' : 'Er zijn nog geen contacten. Klik op "Nieuw Contact" om te beginnen.'}
          </Text>
        </Paper>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Naam</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Telefoon</Table.Th>
              <Table.Th>Dossiers</Table.Th>
              {/* <Table.Th>Rol</Table.Th> */}
              <Table.Th>Acties</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPersonen.map((persoon) => (
              <Table.Tr key={persoon.persoonId || persoon._id || persoon.id}>
                <Table.Td>{getVolledigeNaam(persoon)}</Table.Td>
                <Table.Td>{persoon.email || '-'}</Table.Td>
                <Table.Td>{persoon.telefoon || '-'}</Table.Td>
                <Table.Td>
                  {persoon.dossiers && persoon.dossiers.length > 0 ? (
                    <Group gap="xs">
                      {persoon.dossiers.slice(0, 3).map((dossierNummer) => (
                        <Badge key={dossierNummer} size="sm" variant="dot" color="blue">
                          {dossierNummer}
                        </Badge>
                      ))}
                      {persoon.dossiers.length > 3 && (
                        <Badge size="sm" variant="light" color="gray">
                          +{persoon.dossiers.length - 3}
                        </Badge>
                      )}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                {/* <Table.Td>
                  <Badge variant="light">
                    {mockRollen[persoon._id] || 'Contact'}
                  </Badge>
                </Table.Td> */}
                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={16} />}
                        onClick={() => navigate(`/contacten/bewerk/${persoon.id}`)}
                      >
                        Bewerken
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => handleDeleteClick(persoon)}
                      >
                        Verwijderen
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Contact verwijderen"
      >
        <Text mb="md">
          Weet je zeker dat je <strong>{persoonToDelete && getVolledigeNaam(persoonToDelete)}</strong> wilt verwijderen?
        </Text>
        <Text c="dimmed" size="sm" mb="md">
          Deze actie kan niet ongedaan worden gemaakt.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Annuleren
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Verwijderen
          </Button>
        </Group>
      </Modal>
    </Container>
  )
}