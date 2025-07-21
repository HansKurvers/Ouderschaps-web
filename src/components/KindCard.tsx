import { Card, Group, Text, Button } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { DossierKind } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

interface KindCardProps {
  dossierKind: DossierKind
  onRemove: (id: number) => void
}

export function KindCard({ dossierKind, onRemove }: KindCardProps) {
  const kind = dossierKind.kind
  if (!kind) return null

  return (
    <Card withBorder p="md">
      <Group justify="space-between">
        <div>
          <Text fw={500} size="lg">{getVolledigeNaam(kind)}</Text>
          {kind.geboorteDatum && (
            <Text size="sm" c="dimmed">
              Geboren: {new Date(kind.geboorteDatum).toLocaleDateString('nl-NL')}
            </Text>
          )}
          {kind.geslacht && (
            <Text size="sm" c="dimmed">
              Geslacht: {kind.geslacht}
            </Text>
          )}
        </div>
        <Button
          variant="subtle"
          color="red"
          size="sm"
          leftSection={<IconTrash size={16} />}
          onClick={()=> onRemove( kind.id )}
        >
          Verwijder
        </Button>
      </Group>
    </Card>
  )
}