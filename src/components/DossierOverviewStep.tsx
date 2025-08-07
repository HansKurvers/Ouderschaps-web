import { Stack, Title, Card, Text, Table, Badge, Group, Loader, ScrollArea } from '@mantine/core'
import { Persoon, DossierKind } from '../types/api.types'
import { IconUser, IconUsers, IconCalendar, IconPhone, IconMail, IconClock, IconBeach, IconGift, IconStar, IconChecklist, IconCheckupList } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { omgangService } from '../services/omgang.service'
import { zorgService } from '../services/zorg.service'

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
  dossierId?: string
}

export function DossierOverviewStep({ 
  dossierNummer, 
  partij1, 
  partij2,
  kinderen = [],
  getVolledigeNaam,
  dossierId 
}: DossierOverviewStepProps) {
  const [omgangData, setOmgangData] = useState<any[]>([])
  const [zorgRegelingen, setZorgRegelingen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dagen, setDagen] = useState<any[]>([])
  const [dagdelen, setDagdelen] = useState<any[]>([])

  useEffect(() => {
    if (dossierId) {
      loadAllData()
    }
  }, [dossierId])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load reference data for omgang
      const [dagenData, dagdelenData] = await Promise.all([
        omgangService.getDagen(),
        omgangService.getDagdelen()
      ])
      setDagen(dagenData?.data || [])
      setDagdelen(dagdelenData?.data || [])
      
      // Load omgang data
      const omgangResponse = await omgangService.getOmgangByDossier(dossierId!)
      setOmgangData(omgangResponse?.data || [])
      
      // Load zorg regelingen
      const zorgResponse = await zorgService.getZorgRegelingen(dossierId!)
      setZorgRegelingen(zorgResponse || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL')
  }

  const getPartijNaam = (verzorgerId?: string | null) => {
    if (!verzorgerId) return '-'
    if (partij1.persoon && (partij1.persoon.persoonId === verzorgerId || partij1.persoon._id === verzorgerId)) {
      return partij1.persoon.roepnaam || partij1.persoon.voornamen || 'Partij 1'
    }
    if (partij2.persoon && (partij2.persoon.persoonId === verzorgerId || partij2.persoon._id === verzorgerId)) {
      return partij2.persoon.roepnaam || partij2.persoon.voornamen || 'Partij 2'
    }
    return 'Onbekend'
  }

  return (
    <Stack>
      <Title order={3}>Dossier Overzicht</Title>
      
      {/* Dossier Summary Card */}
      <Card withBorder p="md" shadow="sm">
        <Group justify="space-between" mb="md">
          <Title order={4}>Dossier Informatie</Title>
          <Badge size="lg" variant="filled">{dossierNummer}</Badge>
        </Group>
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600}>Dossiernummer</Table.Td>
              <Table.Td>{dossierNummer}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Status</Table.Td>
              <Table.Td><Badge color="green">Actief</Badge></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Partijen</Table.Td>
              <Table.Td>
                {partij1.persoon && partij2.persoon ? (
                  <Text>{getVolledigeNaam(partij1.persoon)} & {getVolledigeNaam(partij2.persoon)}</Text>
                ) : (
                  <Text c="dimmed">Geen partijen geselecteerd</Text>
                )}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Aantal kinderen</Table.Td>
              <Table.Td>{kinderen.length}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>
      
      {/* Partijen Table */}
      <Card withBorder p="md" shadow="sm">
        <Group mb="md">
          <IconUsers size={20} />
          <Title order={4}>Partijen</Title>
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Naam</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Adres</Table.Th>
              <Table.Th>Geboortedatum</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {partij1.persoon && (
              <Table.Tr>
                <Table.Td>
                  <Badge variant="light" color="blue">Partij 1</Badge>
                </Table.Td>
                <Table.Td fw={500}>{getVolledigeNaam(partij1.persoon)}</Table.Td>
                <Table.Td>
                  {partij1.persoon.email && (
                    <Group gap="xs">
                      <IconMail size={14} />
                      <Text size="sm">{partij1.persoon.email}</Text>
                    </Group>
                  )}
                  {partij1.persoon.telefoon && (
                    <Group gap="xs" mt={4}>
                      <IconPhone size={14} />
                      <Text size="sm">{partij1.persoon.telefoon}</Text>
                    </Group>
                  )}
                  {!partij1.persoon.email && !partij1.persoon.telefoon && (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {partij1.persoon.adres ? (
                    <Stack gap={2}>
                      <Text size="sm">{partij1.persoon.adres}</Text>
                      {partij1.persoon.postcode && partij1.persoon.plaats && (
                        <Text size="sm">{partij1.persoon.postcode} {partij1.persoon.plaats}</Text>
                      )}
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(partij1.persoon.geboorteDatum)}</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {partij2.persoon && (
              <Table.Tr>
                <Table.Td>
                  <Badge variant="light" color="green">Partij 2</Badge>
                </Table.Td>
                <Table.Td fw={500}>{getVolledigeNaam(partij2.persoon)}</Table.Td>
                <Table.Td>
                  {partij2.persoon.email && (
                    <Group gap="xs">
                      <IconMail size={14} />
                      <Text size="sm">{partij2.persoon.email}</Text>
                    </Group>
                  )}
                  {partij2.persoon.telefoon && (
                    <Group gap="xs" mt={4}>
                      <IconPhone size={14} />
                      <Text size="sm">{partij2.persoon.telefoon}</Text>
                    </Group>
                  )}
                  {!partij2.persoon.email && !partij2.persoon.telefoon && (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {partij2.persoon.adres ? (
                    <Stack gap={2}>
                      <Text size="sm">{partij2.persoon.adres}</Text>
                      {partij2.persoon.postcode && partij2.persoon.plaats && (
                        <Text size="sm">{partij2.persoon.postcode} {partij2.persoon.plaats}</Text>
                      )}
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(partij2.persoon.geboorteDatum)}</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Kinderen Table */}
      {kinderen.length > 0 && (
        <Card withBorder p="md" shadow="sm">
          <Group mb="md">
            <IconUser size={20} />
            <Title order={4}>Kinderen ({kinderen.length})</Title>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Naam</Table.Th>
                <Table.Th>Geboortedatum</Table.Th>
                <Table.Th>Ouders</Table.Th>
                <Table.Th>Relatie</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {kinderen.map((kind) => (
                <Table.Tr key={kind.id}>
                  <Table.Td fw={500}>
                    {kind.kind.roepnaam || kind.kind.voornamen || ''} 
                    {kind.kind.tussenvoegsel ? `${kind.kind.tussenvoegsel} ` : ''}
                    {kind.kind.achternaam}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconCalendar size={14} />
                      <Text size="sm">{formatDate(kind.kind.geboorteDatum)}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {kind.ouders.map((ouderRelatie, idx) => (
                      <Text key={idx} size="sm">
                        {ouderRelatie.ouder.voornamen || ouderRelatie.ouder.roepnaam || ''} 
                        {ouderRelatie.ouder.tussenvoegsel ? `${ouderRelatie.ouder.tussenvoegsel} ` : ''}
                        {ouderRelatie.ouder.achternaam}
                      </Text>
                    ))}
                  </Table.Td>
                  <Table.Td>
                    {kind.ouders.map((ouderRelatie, idx) => (
                      <Badge key={idx} size="sm" variant="outline" mb={idx < kind.ouders.length - 1 ? 4 : 0}>
                        {ouderRelatie.relatieType.naam}
                      </Badge>
                    ))}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Omgangsregeling Table */}
      {dossierId && (
        <Card withBorder p="md" shadow="sm">
          <Group mb="md">
            <IconClock size={20} />
            <Title order={4}>Omgangsregeling</Title>
          </Group>
          {loading ? (
            <Loader size="sm" />
          ) : omgangData.length > 0 ? (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Week</Table.Th>
                    {dagen.map(dag => (
                      <Table.Th key={dag.id}>{dag.naam}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dagdelen.map(dagdeel => (
                    <Table.Tr key={dagdeel.id}>
                      <Table.Td fw={500}>{dagdeel.naam}</Table.Td>
                      {dagen.map(dag => {
                        const omgang = omgangData.find(o => 
                          o.dagId === dag.id && o.dagdeelId === dagdeel.id
                        )
                        return (
                          <Table.Td key={`${dag.id}-${dagdeel.id}`}>
                            <Badge 
                              size="sm" 
                              variant="filled"
                              color={omgang?.verzorgerId === partij1.persoon?.persoonId ? 'blue' : 
                                     omgang?.verzorgerId === partij2.persoon?.persoonId ? 'orange' : 'gray'}
                            >
                              {getPartijNaam(omgang?.verzorgerId)}
                            </Badge>
                            {omgang?.wisselTijd && (
                              <Text size="xs" c="dimmed" mt={2}>
                                {omgang.wisselTijd}
                              </Text>
                            )}
                          </Table.Td>
                        )
                      })}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          ) : (
            <Text c="dimmed">Geen omgangsregeling ingesteld</Text>
          )}
        </Card>
      )}

      {/* Zorg Regelingen Table */}
      {dossierId && (
        <Card withBorder p="md" shadow="sm">
          <Group mb="md">
            <IconCheckupList size={20} />
            <Title order={4}>Zorg Regelingen</Title>
          </Group>
          {loading ? (
            <Loader size="sm" />
          ) : zorgRegelingen.length > 0 ? (
            <Stack gap="md">
              {/* Group by category */}
              {['Vakanties', 'Feestdagen', 'Bijzondere dagen', 'Beslissingen'].map(category => {
                const categoryRegelingen = zorgRegelingen.filter(r => {
                  if (category === 'Vakanties') return r.zorgSituatie?.zorgCategorieId === 6
                  if (category === 'Feestdagen') return r.zorgSituatie?.zorgCategorieId === 9
                  if (category === 'Bijzondere dagen') return r.zorgSituatie?.zorgCategorieId === 10
                  return r.zorgSituatie && ![6, 9, 10].includes(r.zorgSituatie.zorgCategorieId)
                })
                
                if (categoryRegelingen.length === 0) return null
                
                return (
                  <Stack key={category} gap="xs">
                    <Group gap="xs">
                      {category === 'Vakanties' && <IconBeach size={16} />}
                      {category === 'Feestdagen' && <IconGift size={16} />}
                      {category === 'Bijzondere dagen' && <IconStar size={16} />}
                      {category === 'Beslissingen' && <IconChecklist size={16} />}
                      <Text fw={600} size="sm">{category}</Text>
                    </Group>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Situatie</Table.Th>
                          <Table.Th>Overeenkomst</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {categoryRegelingen.map((regeling) => (
                          <Table.Tr key={regeling.id}>
                            <Table.Td fw={500}>
                              {regeling.customNaam || regeling.zorgSituatie?.naam || 'Onbekend'}
                              {regeling.zorgSituatie?.startDatum && (
                                <Text size="xs" c="dimmed">
                                  {formatDate(regeling.zorgSituatie.startDatum)}
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {regeling.customOvereenkomst || regeling.overeenkomst || '-'}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                )
              })}
            </Stack>
          ) : (
            <Text c="dimmed">Geen zorg regelingen ingesteld</Text>
          )}
        </Card>
      )}
    </Stack>
  )
}