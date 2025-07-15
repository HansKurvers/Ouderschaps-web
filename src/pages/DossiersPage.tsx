import { useEffect, useState } from 'react'
import { Container, Title, Table, Badge, Button, Group, Loader, Alert, Paper, Text } from '@mantine/core'
import { IconPlus, IconEye } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { dossierService } from '../services/dossier.service'
import { Dossier } from '../types/api.types'

export function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      setLoading(true)
      setError(null)
      // Probeer zonder parameters eerst
      const data = await dossierService.getDossiers()
      setDossiers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'blue'
      case 'afgerond':
        return 'green'
      case 'gearchiveerd':
        return 'gray'
      default:
        return 'yellow'
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
        <Button leftSection={<IconPlus size={20} />}>
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
              <Table.Th>Status</Table.Th>
              <Table.Th>Aangemaakt</Table.Th>
              <Table.Th>Laatst gewijzigd</Table.Th>
              <Table.Th>Acties</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dossiers.map((dossier) => (
              <Table.Tr key={dossier._id}>
                <Table.Td>{dossier.naam}</Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(dossier.status)}>
                    {dossier.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {new Date(dossier.createdAt).toLocaleDateString('nl-NL')}
                </Table.Td>
                <Table.Td>
                  {new Date(dossier.updatedAt).toLocaleDateString('nl-NL')}
                </Table.Td>
                <Table.Td>
                  <Button
                    component={Link}
                    to={`/dossiers/${dossier.dossierId}`}
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={16} />}
                  >
                    Bekijk
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