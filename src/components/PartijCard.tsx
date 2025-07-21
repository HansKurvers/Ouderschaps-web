import { Card, Group, Text, Badge, Button } from '@mantine/core'
import { IconUserPlus } from '@tabler/icons-react'
import { Persoon, Rol } from '../types/api.types'

interface PartijCardProps {
  partijNumber: 1 | 2
  persoon: Persoon | null
  rolId: string
  rollen: Rol[]
  onSelect: () => void
  getVolledigeNaam: (persoon: Persoon) => string
}

export function PartijCard({ 
  partijNumber, 
  persoon, 
  rolId, 
  rollen, 
  onSelect, 
  getVolledigeNaam 
}: PartijCardProps) {
  const partijLabel = `Partij ${partijNumber}`
  const rolNaam = rollen.find(r => String(r.id) === rolId)?.naam || partijLabel

  return (
    <div>
      <Text fw={500} mb="sm">{partijLabel}</Text>
      {persoon ? (
        <Card withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text fw={500}>{getVolledigeNaam(persoon)}</Text>
              <Text size="sm" c="dimmed">{persoon.email || 'Geen email'}</Text>
              <Badge mt="xs">{rolNaam}</Badge>
            </div>
            <Button variant="light" onClick={onSelect}>
              Wijzig persoon
            </Button>
          </Group>
        </Card>
      ) : (
        <Button
          leftSection={<IconUserPlus size={20} />}
          onClick={onSelect}
        >
          Selecteer persoon voor {partijLabel}
        </Button>
      )}
    </div>
  )
}