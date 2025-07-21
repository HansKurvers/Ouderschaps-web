import { Stack, Title, Card, Text } from '@mantine/core'
import { Persoon } from '../types/api.types'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

interface DossierOverviewStepProps {
  dossierNummer: string
  partij1: PartijData
  partij2: PartijData
  getVolledigeNaam: (persoon: Persoon) => string
}

export function DossierOverviewStep({ 
  dossierNummer, 
  partij1, 
  partij2, 
  getVolledigeNaam 
}: DossierOverviewStepProps) {
  return (
    <Stack>
      <Title order={3}>Controle & Overzicht</Title>
      
      <Card withBorder p="md">
        <Text fw={500} mb="xs">Dossier gegevens</Text>
        <Text>Dossiernummer: {dossierNummer}</Text>
        {partij1.persoon && partij2.persoon && (
          <Text mt="xs" fw={500}>
            {getVolledigeNaam(partij1.persoon)} & {getVolledigeNaam(partij2.persoon)}
          </Text>
        )}
      </Card>
      
      <Card withBorder p="md">
        <Text fw={500} mb="xs">Partij 1</Text>
        {partij1.persoon ? (
          <>
            <Text>{getVolledigeNaam(partij1.persoon)}</Text>
            <Text size="sm" c="dimmed">{partij1.persoon.email || 'Geen email'}</Text>
          </>
        ) : (
          <Text c="dimmed">Niet geselecteerd</Text>
        )}
      </Card>
      
      <Card withBorder p="md">
        <Text fw={500} mb="xs">Partij 2</Text>
        {partij2.persoon ? (
          <>
            <Text>{getVolledigeNaam(partij2.persoon)}</Text>
            <Text size="sm" c="dimmed">{partij2.persoon.email || 'Geen email'}</Text>
          </>
        ) : (
          <Text c="dimmed">Niet geselecteerd</Text>
        )}
      </Card>
    </Stack>
  )
}