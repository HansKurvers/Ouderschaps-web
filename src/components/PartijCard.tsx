import { Card, Group, Text, Badge, Button } from '@mantine/core'
import { IconUserPlus } from '@tabler/icons-react'
import { Persoon, Rol } from '../types/api.types'

const PARTIJ_COLORS = {
  partij1: 'brand.4',
  partij2: 'orange.5'
}

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
  const partijColor = partijNumber === 1 ? PARTIJ_COLORS.partij1 : PARTIJ_COLORS.partij2

  return (
    <div>
      <Group mb="sm">
        <Badge color={partijColor} size="lg" variant="light">
          {partijLabel}
        </Badge>
      </Group>
      {persoon ? (
        <Card withBorder p="md" style={{ borderColor: partijColor, borderWidth: 2 }}>
          <Group justify="space-between">
            <div>
              <Text fw={500}>{getVolledigeNaam(persoon)}</Text>
              <Text size="sm" c="dimmed">{persoon.email || 'Geen email'}</Text>
              <Badge mt="xs" color={partijColor} variant="light">{rolNaam}</Badge>
            </div>
            <Button variant="light" color={partijColor} onClick={onSelect}>
              Wijzig persoon
            </Button>
          </Group>
        </Card>
      ) : (
        <Button
          leftSection={<IconUserPlus size={20} />}
          onClick={onSelect}
          color={partijColor}
          variant="light"
        >
          Selecteer persoon voor {partijLabel}
        </Button>
      )}
    </div>
  )
}