import { useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  Table,
  Button,
  Group,
  Stack,
  Text,
  Loader,
  Alert
} from '@mantine/core'
import { IconSearch, IconUserPlus } from '@tabler/icons-react'
import { persoonService } from '../services/persoon.service'
import { Persoon } from '../types/api.types'

interface PersonenSelectModalProps {
  opened: boolean
  onClose: () => void
  onSelect: (persoon: Persoon) => void
  onCreateNew: () => void
  excludeIds?: string[]
  title?: string
}

export function PersonenSelectModal({
  opened,
  onClose,
  onSelect,
  onCreateNew,
  excludeIds = [],
  title = 'Selecteer een persoon'
}: PersonenSelectModalProps) {
  const [personen, setPersonen] = useState<Persoon[]>([])
  const [filteredPersonen, setFilteredPersonen] = useState<Persoon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (opened) {
      loadPersonen()
    }
  }, [opened])

  useEffect(() => {
    filterPersonen()
  }, [personen, searchQuery, excludeIds])

  const loadPersonen = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await persoonService.getPersonen()
      setPersonen(data)
    } catch (err) {
      setError('Kon personen niet laden')
      setPersonen([])
    } finally {
      setLoading(false)
    }
  }

  const filterPersonen = () => {
    let filtered = personen.filter(p => !excludeIds.includes(p.persoonId))
    
    if (searchQuery) {
      filtered = filtered.filter(persoon => {
        const volledigeNaam = [
          persoon.voornamen,
          persoon.tussenvoegsel,
          persoon.achternaam
        ].filter(Boolean).join(' ').toLowerCase()
        
        return volledigeNaam.includes(searchQuery.toLowerCase())
      })
    }
    
    setFilteredPersonen(filtered)
  }

  const getVolledigeNaam = (persoon: Persoon) => {
    const delen = [
      persoon.roepnaam || persoon.voornamen,
      persoon.tussenvoegsel,
      persoon.achternaam
    ].filter(Boolean)
    return delen.join(' ')
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <Stack>
        <Group>
          <TextInput
            placeholder="Zoek op naam..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconUserPlus size={16} />}
            onClick={() => {
              onClose()
              onCreateNew()
            }}
          >
            Nieuwe persoon
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : error ? (
          <Alert color="red">{error}</Alert>
        ) : filteredPersonen.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">
            {searchQuery ? 'Geen personen gevonden' : 'Nog geen personen beschikbaar'}
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Naam</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Telefoon</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPersonen.map((persoon) => (
                <Table.Tr key={persoon._id}>
                  <Table.Td>{getVolledigeNaam(persoon)}</Table.Td>
                  <Table.Td>{persoon.email || '-'}</Table.Td>
                  <Table.Td>{persoon.telefoon || '-'}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      onClick={() => {
                        onSelect(persoon)
                        onClose()
                      }}
                    >
                      Selecteer
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Modal>
  )
}