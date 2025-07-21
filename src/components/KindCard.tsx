import { Card, Group, Text, Button } from '@mantine/core'
import { IconTrash, IconEdit } from '@tabler/icons-react'
import { DossierKind } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

interface KindCardProps {
  dossierKind: DossierKind
  onRemove: (id: number) => void
  onEdit?: (dossierKind: DossierKind) => void
  hideRemoveButton?: boolean
}

export function KindCard({ dossierKind, onRemove, onEdit, hideRemoveButton }: KindCardProps) {
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
        {!hideRemoveButton && (
          <Group gap="xs">
            {onEdit && (
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconEdit size={16} />}
                onClick={() => onEdit(dossierKind)}
              >
                Aanpassen
              </Button>
            )}
            <Button
              variant="subtle"
              color="red"
              size="sm"
              leftSection={<IconTrash size={16} />}
              onClick={() => onRemove(typeof kind.id === 'string' ? parseInt(kind.id) : kind.id!)}
            >
              Verwijder
            </Button>
          </Group>
        )}
      </Group>
    </Card>
  )
}