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
  Text,
  Tooltip
} from '@mantine/core'
import { IconPlus, IconTrash, IconInfoCircle } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { omgangService } from '../services/omgang.service'
import { Dag, Dagdeel, WeekRegeling, Persoon, Omgang } from '../types/api.types'

interface OmgangCell {
  verzorgerId: string | null
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
  partij1: 'brand.4',
  partij2: 'orange.5'
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
    } else if (!dossierId && dagen.length > 0 && dagdelen.length > 0 && weekTabellen.length === 0) {
      // If no dossierId, ensure we have at least one empty table
      setWeekTabellen([createEmptyWeekTabel()])
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
      const dagenArray = dagenData?.data || []
      const dagdelenArray = dagdelenData?.data || []
      const weekRegelingenArray = weekRegelingenData?.data || []
      
      setDagen(dagenArray)
      setDagdelen(dagdelenArray)
      setWeekRegelingen(weekRegelingenArray)
      
      setLoading(false)
    } catch (error) {
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
      
      // Handle the response structure - it returns {success: true, data: Array}
      let omgangData: Omgang[] = []
      if (response && typeof response === 'object' && 'data' in response) {
        omgangData = response.data
      } else if (Array.isArray(response)) {
        omgangData = response
      }
      
      if (!Array.isArray(omgangData) || omgangData.length === 0) {
        // No existing data, create empty table
        setWeekTabellen([createEmptyWeekTabel()])
        return
      }
      
      // Group by weekRegelingId
      const groupedByWeek = omgangData.reduce((acc, omgang) => {
        const weekId = omgang.weekRegelingId || omgang.weekRegeling?.id || 1
        const dagId = omgang.dag?.id || omgang.dagId
        const dagdeelId = omgang.dagdeel?.id || omgang.dagdeelId
        const verzorgerId = omgang.verzorger?.id || omgang.verzorger?.persoonId || omgang.verzorgerId
        
        
        if (!acc[weekId]) {
          acc[weekId] = {
            omgangData: {},
            wisselTijden: {}
          }
        }
        
        const key = `${dagId}-${dagdeelId}`
        acc[weekId].omgangData[key] = {
          verzorgerId: verzorgerId?.toString() || null
        }
        
        // Store wisseltijd per day only if it hasn't been set yet
        // This preserves the first wisseltijd found for each day
        if (omgang.wisselTijd && !acc[weekId].wisselTijden[dagId]) {
          acc[weekId].wisselTijden[dagId] = omgang.wisselTijd
        }
        
        return acc
      }, {} as Record<number, { omgangData: Record<string, OmgangCell>, wisselTijden: Record<number, string> }>)
      
      // Create tables from grouped data
      const tabellen = Object.entries(groupedByWeek).map(([weekId, groupData]) => {
        // If dagen and dagdelen are available, create a complete grid
        const completeOmgangData: Record<string, OmgangCell> = {}
        
        if (dagen.length > 0 && dagdelen.length > 0) {
          // Initialize all cells with null values
          dagen.forEach(dag => {
            dagdelen.forEach(dagdeel => {
              const key = `${dag.id}-${dagdeel.id}`
              completeOmgangData[key] = { verzorgerId: null }
            })
          })
          
          // Override with actual data from the database
          Object.entries(groupData.omgangData).forEach(([key, cellData]) => {
            completeOmgangData[key] = cellData
          })
        } else {
          // If reference data not loaded yet, just use the data as-is
          Object.assign(completeOmgangData, groupData.omgangData)
        }
        
        return {
          id: Math.random().toString(36).substring(2, 9),
          weekRegelingId: parseInt(weekId),
          omgangData: completeOmgangData,
          wisselTijden: groupData.wisselTijden
        }
      })
      
      
      // If no tables were created (shouldn't happen if we have data), create an empty one
      if (tabellen.length === 0) {
        setWeekTabellen([createEmptyWeekTabel()])
      } else {
        setWeekTabellen(tabellen)
      }
    } catch (error) {
      console.error('Error loading existing omgang:', error)
      // On error, create empty table
      setWeekTabellen([createEmptyWeekTabel()])
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
          emptyData[key] = { verzorgerId: null }
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
    verzorgerId: string | null
  ) => {
    const key = `${dagId}-${dagdeelId}`
    setWeekTabellen(weekTabellen.map(tabel => 
      tabel.id === tabelId 
        ? {
            ...tabel,
            omgangData: {
              ...tabel.omgangData,
              [key]: { verzorgerId }
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
    
    // Find the current tabel to preserve existing dagdeel assignments
    const currentTabel = weekTabellen.find(t => t.id === tabelId)
    if (!currentTabel) return
    
    let dayCount = 0
    const updatedOmgangData: Record<string, OmgangCell> = { ...currentTabel.omgangData }
    
    // Apply preset logic: for each day, check if it already has assignments
    // If a day has mixed assignments (different parties for different dagdelen), 
    // we'll update all dagdelen to match the preset
    // If a day is completely empty, assign all dagdelen according to preset
    dagen.forEach(dag => {
      const defaultVerzorgerId = dayCount < dagen1 ? partij1Id : partij2Id
      
      // Check if this day has any existing assignments
      const dayHasAssignments = dagdelen.some(dagdeel => {
        const key = `${dag.id}-${dagdeel.id}`
        return updatedOmgangData[key]?.verzorgerId !== null
      })
      
      // If day has assignments, check if they're all the same party
      let currentDayVerzorgerId: string | null = null
      let dayHasMixedAssignments = false
      
      if (dayHasAssignments) {
        const verzorgerIds = dagdelen.map(dagdeel => {
          const key = `${dag.id}-${dagdeel.id}`
          return updatedOmgangData[key]?.verzorgerId
        }).filter(id => id !== null)
        
        if (verzorgerIds.length > 0) {
          currentDayVerzorgerId = verzorgerIds[0]
          dayHasMixedAssignments = verzorgerIds.some(id => id !== currentDayVerzorgerId)
        }
      }
      
      // Only update if:
      // 1. Day has no assignments, OR
      // 2. Day has mixed assignments (different parties for different dagdelen), OR
      // 3. All assignments for the day are different from what the preset suggests
      if (!dayHasAssignments || dayHasMixedAssignments || currentDayVerzorgerId !== defaultVerzorgerId) {
        dagdelen.forEach(dagdeel => {
          const key = `${dag.id}-${dagdeel.id}`
          updatedOmgangData[key] = { 
            verzorgerId: defaultVerzorgerId
          }
        })
      }
      
      dayCount++
    })
    
    setWeekTabellen(weekTabellen.map(tabel => 
      tabel.id === tabelId 
        ? {
            ...tabel,
            omgangData: updatedOmgangData,
            // Preserve existing wisselTijden instead of clearing them
            wisselTijden: { ...tabel.wisselTijden }
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
    
    // Also check if verzorgerId matches the numeric id
    if (verzorgerId === partij1Id || verzorgerId === partij1?.persoon?.id?.toString()) return PARTIJ_COLORS.partij1
    if (verzorgerId === partij2Id || verzorgerId === partij2?.persoon?.id?.toString()) return PARTIJ_COLORS.partij2
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
      // Process each week table using the upsert week endpoint
      for (const tabel of weekTabellen) {
        if (!tabel.weekRegelingId) continue // Skip tables without a week regeling
        
        // Transform data to match the new API format
        const daysMap = new Map<number, {
          dagId: number,
          wisselTijd: string,
          dagdelen: Array<{ dagdeelId: number, verzorgerId: number }>
        }>()
        
        // Process each cell in the table
        for (const [key, cellData] of Object.entries(tabel.omgangData)) {
          if (cellData.verzorgerId) {
            const [dagId, dagdeelId] = key.split('-').map(Number)
            
            if (!daysMap.has(dagId)) {
              daysMap.set(dagId, {
                dagId,
                wisselTijd: tabel.wisselTijden?.[dagId] || '',
                dagdelen: []
              })
            }
            
            daysMap.get(dagId)!.dagdelen.push({
              dagdeelId,
              verzorgerId: parseInt(cellData.verzorgerId)
            })
          }
        }
        
        // Convert map to array and sort by dagId
        const days = Array.from(daysMap.values()).sort((a, b) => a.dagId - b.dagId)
        
        // Only send if there are days with data
        if (days.length > 0) {
          const weekData = {
            weekRegelingId: tabel.weekRegelingId,
            weekRegelingAnders: '',
            days
          }
          
          await omgangService.upsertWeekData(dossierId, weekData)
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
    return (
      <Card key={tabel.id} shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <Stack gap="xs">
              <Group gap="xs">
                <Text size="sm" fw={500}>Week regeling</Text>
                <Tooltip label="Selecteer wanneer deze regeling van toepassing is (bijv. elke week, even weken, oneven weken)">
                  <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
                </Tooltip>
              </Group>
              <Select
                placeholder="Selecteer week regeling"
                data={weekRegelingen?.map(wr => {
                  // Check if this weekregeling is already used in another table
                  const isUsed = weekTabellen.some(t => 
                    t.id !== tabel.id && t.weekRegelingId === wr.id
                  )
                  return { 
                    value: wr.id.toString(), 
                    label: wr.omschrijving,
                    disabled: isUsed
                  }
                }) || []}
                value={tabel.weekRegelingId?.toString() || null}
                onChange={(value) => updateWeekRegeling(tabel.id, value ? parseInt(value) : null)}
                style={{ width: 300 }}
              />
            </Stack>
            
            <Stack gap="xs">
              <Group gap="xs">
                <Text size="sm" fw={500}>Snelle verdeling</Text>
                <Tooltip label="Kies een standaard verdeling van dagen tussen de partijen. De eerste waarde is het aantal dagen voor partij 1, de tweede voor partij 2.">
                  <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
                </Tooltip>
              </Group>
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
            </Stack>
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
        
        <Table style={{ opacity: tabel.weekRegelingId ? 1 : 0.5 }} cellPadding="md" withTableBorder>
          <thead>
            <tr>
              <th style={{ padding: '12px' }}>Dag</th>
              {dagdelen?.map(dagdeel => (
                <th key={dagdeel.id} style={{ padding: '12px' }}>{dagdeel.naam}</th>
              ))}
              <th style={{ padding: '12px' }}>
                <Group gap="xs">
                  <Text size="sm">Wisselmoment</Text>
                  <Tooltip label="Tijdstip waarop het kind wordt overgedragen tussen de partijen (bijv. 18:00)">
                    <IconInfoCircle size={14} style={{ opacity: 0.5 }} />
                  </Tooltip>
                </Group>
              </th>
            </tr>
          </thead>
          <tbody>
            {dagen?.map(dag => {
              const dagWisselTijd = tabel.wisselTijden?.[dag.id] || ''
              
              return (
                <tr key={dag.id}>
                  <td style={{ padding: '10px' }}><strong>{dag.naam}</strong></td>
                  {dagdelen?.map(dagdeel => {
                    const key = `${dag.id}-${dagdeel.id}`
                    const cellData = tabel.omgangData[key] || { verzorgerId: null }
                    
                    return (
                      <td key={dagdeel.id} style={{ padding: '8px' }}>
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
                              null
                            )}
                          >
                            {(() => {
                              const option = getPartijOptions().find(o => o.value === cellData.verzorgerId)
                              if (option) return option.label
                              
                              // Try to determine which party based on ID
                              if (cellData.verzorgerId === partij1?.persoon?.id?.toString()) {
                                return getPartijLabel(partij1.persoon, 1)
                              }
                              if (cellData.verzorgerId === partij2?.persoon?.id?.toString()) {
                                return getPartijLabel(partij2.persoon, 2)
                              }
                              return 'Onbekend'
                            })()}
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
                              value || null
                            )}
                            size="xs"
                            disabled={!tabel.weekRegelingId}
                          />
                        )}
                      </td>
                    )
                  })}
                  <td style={{ padding: '3px' }}>
                    <TextInput
                      placeholder="Wisselmoment"
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
      
      <Stack gap="xl">
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