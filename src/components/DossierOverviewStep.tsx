import { Stack, Title, Card, Text, Grid } from '@mantine/core'
import { Persoon, DossierKind } from '../types/api.types'
import { KindCard } from './KindCard'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

interface DossierOverviewStepProps {
  dossierNummer: string
  partij1: PartijData
  partij2: PartijData
  kinderen?: DossierKind[]
  getVolledigeNaam: (persoon: Persoon) => string
}

export function DossierOverviewStep({ 
  dossierNummer, 
  partij1, 
  partij2,
  kinderen = [],
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

      {kinderen.length > 0 && (
        <Card withBorder p="md">
          <Text fw={500} mb="md">Kinderen ({kinderen.length})</Text>
          <Grid>
            {kinderen.map((kind) => (
              <Grid.Col key={kind.id} span={{ base: 12, md: 6 }}>
                <KindCard
                  dossierKind={kind}
                  onRemove={() => {}}
                  hideRemoveButton={true}
                />
              </Grid.Col>
            ))}
          </Grid>
        </Card>
      )}
    </Stack>
  )
}