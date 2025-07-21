import React, { useState, useEffect, useImperativeHandle } from 'react'
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
  Badge,
  Checkbox,
  ColorSwatch,
  Text
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
  wisselTijden: Record<number, string> // Store wisseltijd per day
}

interface OmgangsregelingStepProps {
  dossierId?: string
  partij1: { persoon: Persoon | null }
  partij2: { persoon: Persoon | null }
  onDataChange?: (data: WeekTabelData[]) => void
}

const PARTIJ_COLORS = {
  partij1: '#58b3e5',
  partij2: '#ff9f40'
}

export interface OmgangsregelingStepHandle {
  saveData: () => Promise<void>
}

export const OmgangsregelingStep = React.forwardRef<OmgangsregelingStepHandle, OmgangsregelingStepProps>(
  ({ dossierId, partij1, partij2, onDataChange }, ref) => {
  const [dagen, setDagen] = useState<Dag[]>([])
  const [dagdelen, setDagdelen] = useState<Dagdeel[]>([])
  const [weekRegelingen, setWeekRegelingen] = useState<WeekRegeling[]>([])
  const [weekTabellen, setWeekTabellen] = useState<WeekTabelData[]>([])
  const [loading, setLoading] = useState(true)
  const [gebruikRoepnamen, setGebruikRoepnamen] = useState(false)

  useImperativeHandle(ref, () => ({
    saveData: saveOmgangData
  }))

  useEffect(() => {
    loadReferenceData()
  }, [])
  
  useEffect(() => {
    if (dossierId && dagen.length > 0 && dagdelen.length > 0) {
      loadExistingOmgang()
    }
  }, [dossierId, dagen.length, dagdelen.length])

  useEffect(() => {
    if (onDataChange && weekTabellen.length > 0) {
      onDataChange(weekTabellen)
    }
  }, [weekTabellen, onDataChange])

  const loadReferenceData = async () => {
    try {
      const [dagenData, dagdelenData, weekRegelingenData] = await Promise.all([
        omgangService.getDagen(),
        omgangService.getDagdelen(),
        omgangService.getWeekRegelingen()
      ])
      console.log('API responses:', { dagenData, dagdelenData, weekRegelingenData })
      const dagenArray = dagenData?.data || []
      const dagdelenArray = dagdelenData?.data || []
      const weekRegelingenArray = weekRegelingenData?.data || []
      
      setDagen(dagenArray)
      setDagdelen(dagdelenArray)
      setWeekRegelingen(weekRegelingenArray)
      
      if (!dossierId && dagenArray.length > 0 && dagdelenArray.length > 0) {
        // Create empty week tabel after data is loaded
        const emptyTabel = createEmptyWeekTabelWithData(dagenArray, dagdelenArray)
        setWeekTabellen([emptyTabel])
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
      
      const tabellen = Object.entries(groupedByWeek).map(([weekId, data]) => {
        const wisselTijden: Record<number, string> = {}
        // Extract wisseltijden per day from the data
        Object.entries(data).forEach(([key, cell]) => {
          const [dagId] = key.split('-').map(Number)
          if (cell.wisselTijd) {
            wisselTijden[dagId] = cell.wisselTijd
          }
        })
        
        return {
          id: Math.random().toString(36).substring(2, 9),
          weekRegelingId: parseInt(weekId),
          omgangData: data,
          wisselTijden
        }
      })
      
      setWeekTabellen(tabellen.length > 0 ? tabellen : [createEmptyWeekTabel()])
    } catch (error) {
      console.error('Error loading existing omgang:', error)
      addWeekTabel()
    }
  }

  const createEmptyWeekTabelWithData = (dagenList: Dag[], dagdelenList: Dagdeel[]): WeekTabelData => {
    const emptyData: Record<string, OmgangCell> = {}
    const wisselTijden: Record<number, string> = {}
    
    dagenList.forEach(dag => {
      wisselTijden[dag.id] = ''
      dagdelenList.forEach(dagdeel => {
        const key = `${dag.id}-${dagdeel.id}`
        emptyData[key] = { verzorgerId: null, wisselTijd: null }
      })
    })
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      weekRegelingId: null,
      omgangData: emptyData,
      wisselTijden
    }
  }

  const createEmptyWeekTabel = (): WeekTabelData => {
    const emptyData: Record<string, OmgangCell> = {}
    const wisselTijden: Record<number, string> = {}
    
    if (dagen && dagen.length > 0 && dagdelen && dagdelen.length > 0) {
      dagen.forEach(dag => {
        wisselTijden[dag.id] = ''
        dagdelen.forEach(dagdeel => {
          const key = `${dag.id}-${dagdeel.id}`
          emptyData[key] = { verzorgerId: null, wisselTijd: null }
        })
      })
    }
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      weekRegelingId: null,
      omgangData: emptyData,
      wisselTijden
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

  const applyPreset = (tabelId: string, preset: string) => {
    if (!preset || !partij1?.persoon || !partij2?.persoon) return
    
    const [dagen1] = preset.split('-').map(Number)
    const partij1Id = (partij1.persoon.persoonId || partij1.persoon.id || partij1.persoon._id)?.toString()
    const partij2Id = (partij2.persoon.persoonId || partij2.persoon.id || partij2.persoon._id)?.toString()
    
    if (!partij1Id || !partij2Id || !dagen || !dagdelen) return
    
    let dayCount = 0
    const updatedOmgangData: Record<string, OmgangCell> = {}
    
    // Simple allocation: first dagen1 days go to partij1, rest to partij2
    dagen.forEach(dag => {
      const verzorgerId = dayCount < dagen1 ? partij1Id : partij2Id
      dagdelen.forEach(dagdeel => {
        const key = `${dag.id}-${dagdeel.id}`
        updatedOmgangData[key] = { verzorgerId, wisselTijd: null }
      })
      dayCount++
    })
    
    setWeekTabellen(weekTabellen.map(tabel => 
      tabel.id === tabelId 
        ? {
            ...tabel,
            omgangData: updatedOmgangData,
            wisselTijden: {} // Clear wisseltijden for presets
          }
        : tabel
    ))
  }

  const getPartijLabel = (persoon: Persoon | null, partijNummer: number) => {
    if (!persoon) return `Partij ${partijNummer}`
    
    if (gebruikRoepnamen) {
      return persoon.roepnaam || persoon.voornamen || `Partij ${partijNummer}`
    }
    return `Partij ${partijNummer}`
  }

  const getPartijColor = (verzorgerId: string | null) => {
    if (!verzorgerId) return undefined
    const partij1Id = (partij1?.persoon?.persoonId || partij1?.persoon?.id || partij1?.persoon?._id)?.toString()
    const partij2Id = (partij2?.persoon?.persoonId || partij2?.persoon?.id || partij2?.persoon?._id)?.toString()
    
    if (verzorgerId === partij1Id) return PARTIJ_COLORS.partij1
    if (verzorgerId === partij2Id) return PARTIJ_COLORS.partij2
    return undefined
  }

  const getPartijOptions = () => {
    const options = []
    
    if (partij1?.persoon) {
      const id = partij1.persoon.persoonId || partij1.persoon.id || partij1.persoon._id
      if (id) {
        options.push({
          value: id.toString(),
          label: getPartijLabel(partij1.persoon, 1)
        })
      }
    }
    if (partij2?.persoon) {
      const id = partij2.persoon.persoonId || partij2.persoon.id || partij2.persoon._id
      if (id) {
        options.push({
          value: id.toString(),
          label: getPartijLabel(partij2.persoon, 2)
        })
      }
    }
    
    return options
  }

  const saveOmgangData = async () => {
    if (!dossierId) return

    try {
      // Delete existing omgang data first
      const existingData = await omgangService.getOmgangByDossier(dossierId)
      if (Array.isArray(existingData)) {
        for (const omgang of existingData) {
          if (omgang.id) {
            await omgangService.deleteOmgang(dossierId, omgang.id)
          }
        }
      }

      // Save new omgang data
      for (const tabel of weekTabellen) {
        for (const [key, cellData] of Object.entries(tabel.omgangData)) {
          if (cellData.verzorgerId) {
            const [dagId, dagdeelId] = key.split('-').map(Number)
            const wisselTijd = tabel.wisselTijden?.[dagId] || undefined
            
            const omgangData = {
              dagId: dagId,
              dagdeelId: dagdeelId,
              verzorgerId: parseInt(cellData.verzorgerId),
              wisselTijd: wisselTijd || '',
              weekRegelingId: tabel.weekRegelingId || 1,
              weekRegelingAnders: ''
            }
            console.log('Creating omgang with data:', omgangData, 'for dossier:', dossierId)
            await omgangService.createOmgang(dossierId, omgangData)
          }
        }
      }

      notifications.show({
        title: 'Succes',
        message: 'Omgangsregeling opgeslagen',
        color: 'green'
      })
    } catch (error) {
      console.error('Error saving omgang:', error)
      notifications.show({
        title: 'Fout',
        message: 'Kon omgangsregeling niet opslaan',
        color: 'red'
      })
    }
  }

  const renderWeekTabel = (tabel: WeekTabelData) => {
    const selectedWeekRegeling = Array.isArray(weekRegelingen) 
      ? weekRegelingen.find(wr => wr.id === tabel.weekRegelingId)
      : undefined
    
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
            <Select
              placeholder="Verdeling preset"
              data={[
                { value: '0-7', label: '0-7 (alle dagen partij 2)' },
                { value: '1-6', label: '1-6' },
                { value: '2-5', label: '2-5' },
                { value: '3-4', label: '3-4' },
                { value: '4-3', label: '4-3' },
                { value: '5-2', label: '5-2' },
                { value: '6-1', label: '6-1' },
                { value: '7-0', label: '7-0 (alle dagen partij 1)' }
              ]}
              onChange={(value) => applyPreset(tabel.id, value || '')}
              clearable
              style={{ width: 200 }}
              disabled={!tabel.weekRegelingId}
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

        {!tabel.weekRegelingId && (
          <Text size="sm" c="dimmed" ta="center" mb="md">
            Selecteer eerst een week regeling om de omgangsregeling in te vullen
          </Text>
        )}
        
        <Table style={{ opacity: tabel.weekRegelingId ? 1 : 0.5 }}>
          <thead>
            <tr>
              <th>Dag</th>
              {dagdelen?.map(dagdeel => (
                <th key={dagdeel.id}>{dagdeel.naam}</th>
              ))}
              <th>Wisseltijd</th>
            </tr>
          </thead>
          <tbody>
            {dagen?.map(dag => {
              const dagWisselTijd = tabel.wisselTijden?.[dag.id] || ''
              
              return (
                <tr key={dag.id}>
                  <td><strong>{dag.naam}</strong></td>
                  {dagdelen?.map(dagdeel => {
                    const key = `${dag.id}-${dagdeel.id}`
                    const cellData = tabel.omgangData[key] || { verzorgerId: null, wisselTijd: null }
                    
                    return (
                      <td key={dagdeel.id}>
                        {cellData.verzorgerId ? (
                          <Badge 
                            color={getPartijColor(cellData.verzorgerId)} 
                            variant="light"
                            fullWidth
                            style={{ 
                              cursor: tabel.weekRegelingId ? 'pointer' : 'not-allowed',
                              opacity: tabel.weekRegelingId ? 1 : 0.5
                            }}
                            onClick={() => tabel.weekRegelingId && updateOmgangCell(
                              tabel.id,
                              dag.id,
                              dagdeel.id,
                              null,
                              cellData.wisselTijd
                            )}
                          >
                            {getPartijOptions().find(o => o.value === cellData.verzorgerId)?.label || 'Onbekend'}
                          </Badge>
                        ) : (
                          <Select
                            placeholder={tabel.weekRegelingId ? "Selecteer" : "Kies eerst week regeling"}
                            data={getPartijOptions()}
                            value={cellData.verzorgerId || undefined}
                            onChange={(value) => updateOmgangCell(
                              tabel.id,
                              dag.id,
                              dagdeel.id,
                              value || null,
                              cellData.wisselTijd
                            )}
                            size="xs"
                            disabled={!tabel.weekRegelingId}
                          />
                        )}
                      </td>
                    )
                  })}
                  <td>
                    <TextInput
                      placeholder="HH:MM"
                      value={dagWisselTijd}
                      onChange={(event) => {
                        const newValue = event.currentTarget.value
                        // Update wisseltijd for this day
                        setWeekTabellen(prevTabellen => 
                          prevTabellen.map(t => 
                            t.id === tabel.id 
                              ? {
                                  ...t,
                                  wisselTijden: {
                                    ...t.wisselTijden,
                                    [dag.id]: newValue
                                  }
                                }
                              : t
                          )
                        )
                      }}
                      size="xs"
                      style={{ width: 80 }}
                      disabled={!tabel.weekRegelingId}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    )
  }

  //TODO check loading problems
  if (loading) {
    return <Container>Laden...</Container>
  }

  return (
    <Container>
      <Title order={2} mb="lg">Omgangsregeling</Title>
      
      <Stack gap="md" mb="lg">
        <Checkbox
          label="Gebruik roepnamen in plaats van 'Partij 1' en 'Partij 2'"
          checked={gebruikRoepnamen}
          onChange={(event) => setGebruikRoepnamen(event.currentTarget.checked)}
        />
        
        <Group gap="lg">
          {partij1?.persoon && (
            <Badge color={PARTIJ_COLORS.partij1} size="lg" variant="light">
              {getPartijLabel(partij1.persoon, 1)}
            </Badge>
          )}
          {partij2?.persoon && (
            <Badge color={PARTIJ_COLORS.partij2} size="lg" variant="light">
              {getPartijLabel(partij2.persoon, 2)}
            </Badge>
          )}
        </Group>
      </Stack>
      
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
})