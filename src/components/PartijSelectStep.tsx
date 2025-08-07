import { Stack, Title } from '@mantine/core'
import { Persoon, Rol } from '../types/api.types'
import { PartijCard } from './PartijCard'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

interface PartijSelectStepProps {
  partij1: PartijData
  partij2: PartijData
  rollen: Rol[]
  onSelectPartij: (partijNumber: 1 | 2) => void
  onEditPartij?: (partijNumber: 1 | 2) => void
  getVolledigeNaam: (persoon: Persoon) => string
}

export function PartijSelectStep({ 
  partij1, 
  partij2, 
  rollen, 
  onSelectPartij,
  onEditPartij, 
  getVolledigeNaam 
}: PartijSelectStepProps) {
  return (
    <Stack>
      <Title order={3}>Selecteer Partijen</Title>
      
      <PartijCard
        partijNumber={1}
        persoon={partij1.persoon}
        rolId={partij1.rolId}
        rollen={rollen}
        onSelect={() => onSelectPartij(1)}
        onEdit={onEditPartij ? () => onEditPartij(1) : undefined}
        getVolledigeNaam={getVolledigeNaam}
      />

      <PartijCard
        partijNumber={2}
        persoon={partij2.persoon}
        rolId={partij2.rolId}
        rollen={rollen}
        onSelect={() => onSelectPartij(2)}
        onEdit={onEditPartij ? () => onEditPartij(2) : undefined}
        getVolledigeNaam={getVolledigeNaam}
      />
    </Stack>
  )
}