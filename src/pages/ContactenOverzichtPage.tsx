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
  Badge
} from '@mantine/core'
import { IconPlus, IconEdit, IconSearch, IconSortAscending, IconSortDescending } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { persoonService } from '../services/persoon.service'
import { dossierService } from '../services/dossier.service'
import { Persoon } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

type SortField = 'naam' | 'rol'
type SortOrder = 'asc' | 'desc'

// Mock data voor nu, later vervangen met echte dossier partijen data
const mockRollen: Record<string, string> = {
  '1': 'Partij 1',
  '2': 'Partij 2',
  '3': 'Advocaat',
  '4': 'Mediator'
}

export function ContactenOverzichtPage() {
  const navigate = useNavigate()
  const [personen, setPersonen] = useState<Persoon[]>([])
  const [filteredPersonen, setFilteredPersonen] = useState<Persoon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('naam')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

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
      const personenData = await persoonService.getPersonen()
      
      // Als we geen personen krijgen, probeer via dossiers
      if (personenData.length === 0) {
        // Haal eerste dossier op om partijen te kunnen ophalen
        const dossiers = await dossierService.getDossiers()
        if (dossiers.length > 0) {
          const dossierId = dossiers[0].dossierId || dossiers[0].dossier_nummer || String(dossiers[0].id)
          const partijen = await dossierService.getDossierPartijen(dossierId)
          // Extract personen uit partijen
          const personenFromPartijen = partijen
            .filter(p => p.persoon)
            .map(p => p.persoon!)
            .filter(p => p.persoonId) // Extra check voor persoonId
          setPersonen(personenFromPartijen)
        } else {
          setPersonen([])
        }
      } else {
        setPersonen(personenData)
      }
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
              <Table.Th>Rol</Table.Th>
              <Table.Th>Acties</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPersonen.map((persoon) => (
              <Table.Tr key={persoon._id}>
                <Table.Td>{getVolledigeNaam(persoon)}</Table.Td>
                <Table.Td>{persoon.email || '-'}</Table.Td>
                <Table.Td>{persoon.telefoon || '-'}</Table.Td>
                <Table.Td>
                  <Badge variant="light">
                    {mockRollen[persoon._id] || 'Contact'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEdit size={16} />}
                    onClick={() => navigate(`/contacten/bewerk/${persoon.id}`)}
                  >
                    Bewerk
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  )
}