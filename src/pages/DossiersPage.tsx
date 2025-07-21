import { useEffect, useState } from 'react'
import { Container, Title, Table, Button, Group, Loader, Alert, Paper, Text, ActionIcon, Menu } from '@mantine/core'
import { IconPlus, IconEdit, IconTrash, IconDots } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { dossierService } from '../services/dossier.service'
import { Dossier } from '../types/api.types'

interface DossierWithDisplay extends Dossier {
  displayNaam?: string
}

export function DossiersPage() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState<DossierWithDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      setLoading(true)
      setError(null)
      // Haal alle dossiers op (inclusief inactieve)
      const data = await dossierService.getDossiers({ includeInactive: true })
      
      // Gebruik alleen dossiernummer als display naam
      const dossiersWithNames = data.map(dossier => ({
        ...dossier,
        displayNaam: `Dossier ${dossier.dossierNummer || dossier.dossier_nummer || dossier.id}`
      }))
      
      setDossiers(dossiersWithNames)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (dossierId: string, dossierNaam: string) => {
    if (!window.confirm(`Weet je zeker dat je dossier "${dossierNaam}" wilt verwijderen?`)) {
      return
    }
    
    try {
      await dossierService.deleteDossier(dossierId)
      notifications.show({
        title: 'Dossier verwijderd',
        message: 'Het dossier is succesvol verwijderd',
        color: 'green',
      })
      loadDossiers()
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon dossier niet verwijderen',
        color: 'red',
      })
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
        <Title order={1}>Mijn Dossiers</Title>
        <Button 
          leftSection={<IconPlus size={20} />}
          onClick={() => navigate('/dossiers/nieuw')}
        >
          Nieuw Dossier
        </Button>
      </Group>

      {dossiers.length === 0 ? (
        <Paper p="xl" withBorder>
          <Text ta="center" c="dimmed">
            Je hebt nog geen dossiers. Klik op "Nieuw Dossier" om te beginnen.
          </Text>
        </Paper>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Naam</Table.Th>
              <Table.Th>Aangemaakt</Table.Th>
              <Table.Th>Laatst gewijzigd</Table.Th>
              <Table.Th>Acties</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dossiers.map((dossier) => (
              <Table.Tr key={dossier.id}>
                <Table.Td>
                  <div>
                    <Text>{dossier.displayNaam || `Dossier ${dossier.dossierNummer || dossier.dossier_nummer}`}</Text>
                    <Text size="xs" c="dimmed">#{dossier.id}</Text>
                  </div>
                </Table.Td>
                <Table.Td>
                  {(dossier.createdAt || dossier.aangemaakt_op) 
                    ? new Date(dossier.createdAt || dossier.aangemaakt_op || '').toLocaleDateString('nl-NL')
                    : '-'
                  }
                </Table.Td>
                <Table.Td>
                  {(dossier.updatedAt || dossier.gewijzigd_op)
                    ? new Date(dossier.updatedAt || dossier.gewijzigd_op || '').toLocaleDateString('nl-NL')
                    : '-'
                  }
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={() => navigate(`/dossiers/bewerk/${dossier.id}`)}
                    >
                      Bewerken
                    </Button>
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light" size="sm">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => handleDelete(String(dossier.id), dossier.displayNaam || `Dossier ${dossier.dossierNummer || dossier.dossier_nummer}`)}
                        >
                          Verwijderen
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  )
}