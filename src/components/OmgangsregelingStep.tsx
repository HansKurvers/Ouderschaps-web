import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Table,
  Select,
  Button,
  Group,
  Stack,
  ActionIcon,
  TextInput,
  Card,
  Badge
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { omgangService } from '../services/omgang.service'
import { Dag, Dagdeel, WeekRegeling, Persoon } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

interface OmgangCell {
  verzorgerId: string | null
  wisselTijd: string | null
}

interface WeekTabelData {
  id: string
  weekRegelingId: number | null
  omgangData: Record<string, OmgangCell>
}

interface OmgangsregelingStepProps {
  dossierId?: string
  partij1: { persoon: Persoon | null }
  partij2: { persoon: Persoon | null }
}

export function OmgangsregelingStep({ dossierId, partij1, partij2 }: OmgangsregelingStepProps) {
  const [dagen, setDagen] = useState<Dag[]>([])
  const [dagdelen, setDagdelen] = useState<Dagdeel[]>([])
  const [weekRegelingen, setWeekRegelingen] = useState<WeekRegeling[]>([])
  const [weekTabellen, setWeekTabellen] = useState<WeekTabelData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReferenceData()
  }, [])
  
  useEffect(() => {
    if (dossierId && dagen.length > 0 && dagdelen.length > 0) {
      loadExistingOmgang()
    }
  }, [dossierId, dagen.length, dagdelen.length])

  const loadReferenceData = async () => {
    try {
      const [dagenData, dagdelenData, weekRegelingenData] = await Promise.all([
        omgangService.getDagen(),
        omgangService.getDagdelen(),
        omgangService.getWeekRegelingen()
      ])
      setDagen(dagenData)
      setDagdelen(dagdelenData)
      setWeekRegelingen(weekRegelingenData)
      
      if (!dossierId) {
        addWeekTabel()
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading reference data:', error)
      notifications.show({
        title: 'Fout',
        message: 'Kon referentie data niet laden',
        color: 'red'
      })
    }
  }

  const loadExistingOmgang = async () => {
    if (!dossierId) return
    
    try {
      const response = await omgangService.getOmgangByDossier(dossierId)
      const omgangData = Array.isArray(response) ? response : []
      
      const groupedByWeek = omgangData.reduce((acc, omgang) => {
        const weekId = omgang.weekRegelingId
        if (!acc[weekId]) {
          acc[weekId] = {}
        }
        const key = `${omgang.dagId}-${omgang.dagdeelId}`
        acc[weekId][key] = {
          verzorgerId: omgang.verzorgerId,
          wisselTijd: omgang.wisselTijd || null
        }
        return acc
      }, {} as Record<number, Record<string, OmgangCell>>)
      
      const tabellen = Object.entries(groupedByWeek).map(([weekId, data]) => ({
        id: Math.random().toString(36).substr(2, 9),
        weekRegelingId: parseInt(weekId),
        omgangData: data
      }))
      
      setWeekTabellen(tabellen.length > 0 ? tabellen : [createEmptyWeekTabel()])
    } catch (error) {
      console.error('Error loading existing omgang:', error)
      addWeekTabel()
    }
  }

  const createEmptyWeekTabel = (): WeekTabelData => {
    const emptyData: Record<string, OmgangCell> = {}
    if (dagen && dagen.length > 0 && dagdelen && dagdelen.length > 0) {
      dagen.forEach(dag => {
        dagdelen.forEach(dagdeel => {
          const key = `${dag.id}-${dagdeel.id}`
          emptyData[key] = { verzorgerId: null, wisselTijd: null }
        })
      })
    }
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      weekRegelingId: null,
      omgangData: emptyData
    }
  }

  const addWeekTabel = () => {
    if (!dagen || dagen.length === 0 || !dagdelen || dagdelen.length === 0) {
      notifications.show({
        title: 'Even geduld',
        message: 'Data wordt nog geladen...',
        color: 'yellow'
      })
      return
    }
    setWeekTabellen([...weekTabellen, createEmptyWeekTabel()])
  }

  const removeWeekTabel = (id: string) => {
    setWeekTabellen(weekTabellen.filter(tabel => tabel.id !== id))
  }

  const updateWeekRegeling = (tabelId: string, weekRegelingId: number | null) => {
    setWeekTabellen(weekTabellen.map(tabel => 
      tabel.id === tabelId ? { ...tabel, weekRegelingId } : tabel
    ))
  }

  const updateOmgangCell = (
    tabelId: string,
    dagId: number,
    dagdeelId: number,
    verzorgerId: string | null,
    wisselTijd: string | null
  ) => {
    const key = `${dagId}-${dagdeelId}`
    setWeekTabellen(weekTabellen.map(tabel => 
      tabel.id === tabelId 
        ? {
            ...tabel,
            omgangData: {
              ...tabel.omgangData,
              [key]: { verzorgerId, wisselTijd }
            }
          }
        : tabel
    ))
  }

  const getPartijOptions = () => {
    const options = []
    if (partij1?.persoon) {
      options.push({
        value: partij1.persoon.persoonId,
        label: getVolledigeNaam(partij1.persoon)
      })
    }
    if (partij2?.persoon) {
      options.push({
        value: partij2.persoon.persoonId,
        label: getVolledigeNaam(partij2.persoon)
      })
    }
    return options
  }

  const renderWeekTabel = (tabel: WeekTabelData) => {
    const selectedWeekRegeling = weekRegelingen?.find(wr => wr.id === tabel.weekRegelingId)
    
    return (
      <Card key={tabel.id} shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <Select
              placeholder="Selecteer week regeling"
              data={weekRegelingen?.map(wr => ({ value: wr.id.toString(), label: wr.omschrijving })) || []}
              value={tabel.weekRegelingId?.toString() || null}
              onChange={(value) => updateWeekRegeling(tabel.id, value ? parseInt(value) : null)}
              style={{ width: 300 }}
            />
            {selectedWeekRegeling && (
              <Badge color="blue" variant="light">
                {selectedWeekRegeling.omschrijving}
              </Badge>
            )}
          </Group>
          {weekTabellen.length > 1 && (
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => removeWeekTabel(tabel.id)}
              title="Verwijder week tabel"
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>

        <Table>
          <thead>
            <tr>
              <th>Dag</th>
              {dagdelen?.map(dagdeel => (
                <th key={dagdeel.id}>{dagdeel.naam}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dagen?.map(dag => (
              <tr key={dag.id}>
                <td><strong>{dag.naam}</strong></td>
                {dagdelen?.map(dagdeel => {
                  const key = `${dag.id}-${dagdeel.id}`
                  const cellData = tabel.omgangData[key] || { verzorgerId: null, wisselTijd: null }
                  
                  return (
                    <td key={dagdeel.id}>
                      <Stack gap="xs">
                        <Select
                          placeholder="Verzorger"
                          data={getPartijOptions()}
                          value={cellData.verzorgerId || ''}
                          onChange={(value) => updateOmgangCell(
                            tabel.id,
                            dag.id,
                            dagdeel.id,
                            value || null,
                            cellData.wisselTijd
                          )}
                          clearable
                          size="xs"
                        />
                        {cellData.verzorgerId && (
                          <TextInput
                            placeholder="Wissel tijd"
                            value={cellData.wisselTijd || ''}
                            onChange={(e) => updateOmgangCell(
                              tabel.id,
                              dag.id,
                              dagdeel.id,
                              cellData.verzorgerId,
                              e.currentTarget.value || null
                            )}
                            size="xs"
                          />
                        )}
                      </Stack>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    )
  }

  if (loading) {
    return <Container>Laden...</Container>
  }

  return (
    <Container>
      <Title order={2} mb="lg">Omgangsregeling</Title>
      
      <Stack gap="lg">
        {weekTabellen.map((tabel) => renderWeekTabel(tabel))}
        
        <Group justify="center">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={addWeekTabel}
            variant="light"
          >
            Week toevoegen
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}