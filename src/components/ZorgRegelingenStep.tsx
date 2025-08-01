import React, { useState, useEffect, useImperativeHandle } from 'react'
import {
  Container,
  Title,
  Stack,
  Card,
  Text,
  Group,
  Loader,
  Button,
  TextInput,
  ActionIcon
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { RegelingTemplateSelectModal } from './RegelingTemplateSelectModal'
import { useRegelingTemplateModal } from '../hooks/useRegelingTemplateModal'
import { zorgService } from '../services/zorg.service'
import { 
  processTemplateText, 
  createDutchPluralReplacements, 
  formatDutchNameList,
  TemplateContext
} from '../utils/templateProcessor'

export interface ZorgSituatie {
  id: number
  naam: string
  startDatum?: string
  eindDatum?: string
  type?: string
}

interface RegelingTemplate {
  id: number
  naam: string
  templateText: string
  type: 'Vakantie' | 'Feestdag' | 'Anders'
  meervoudKinderen: boolean
}

interface ZorgRegeling {
  situatieId: number
  regelingTemplateId: number | null
  zorgId?: string
  overeenkomst?: string
  customNaam?: string
  tempId?: number
}

export interface ZorgRegelingenStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: ZorgRegeling[]) => void
  // Configuration props
  zorgCategorieId: number
  title: string
  situatiesEndpoint: string
  templateType: 'Vakantie' | 'Feestdag' | 'Anders'
  getSituatieLabel?: (situatie: ZorgSituatie) => string
  getTemplateVariables?: (situatie: ZorgSituatie) => TemplateContext
}

export interface ZorgRegelingenStepHandle {
  saveData: () => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const ZorgRegelingenStep = React.forwardRef<ZorgRegelingenStepHandle, ZorgRegelingenStepProps>(
  ({ 
    dossierId, 
    kinderen = [], 
    partij1, 
    partij2, 
    onDataChange,
    zorgCategorieId,
    title,
    situatiesEndpoint,
    templateType,
    getSituatieLabel,
    getTemplateVariables
  }, ref) => {
    const [situaties, setSituaties] = useState<ZorgSituatie[]>([])
    const [regelingTemplates, setRegelingTemplates] = useState<RegelingTemplate[]>([])
    const [zorgRegelingen, setZorgRegelingen] = useState<ZorgRegeling[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSituatieId, setActiveSituatieId] = useState<number | null>(null)
    const [templatesLoaded, setTemplatesLoaded] = useState(false)

    const hasMultipleKinderen = kinderen.length > 1

    const [activeTempId, setActiveTempId] = useState<number | null>(null)
    
    const modal = useRegelingTemplateModal({
      onSelect: (template) => {
        if (activeSituatieId) {
          if (activeTempId) {
            // For custom regelingen, update by tempId
            setZorgRegelingen(prev => 
              prev.map(regeling => 
                regeling.tempId === activeTempId 
                  ? { ...regeling, regelingTemplateId: template.id }
                  : regeling
              )
            )
          } else {
            updateZorgRegeling(activeSituatieId, template.id)
          }
        }
      }
    })

    useImperativeHandle(ref, () => ({
      saveData: saveZorgData
    }))

    useEffect(() => {
      loadData()
    }, [hasMultipleKinderen])

    useEffect(() => {
      if (onDataChange) {
        onDataChange(zorgRegelingen)
      }
    }, [zorgRegelingen, onDataChange])

    // Load existing data when both situaties and templates are loaded
    useEffect(() => {
      if (dossierId && situaties.length > 0 && !loading && templatesLoaded) {
        loadExistingZorgRegelingen()
      }
    }, [dossierId, situaties.length, loading, templatesLoaded])

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load situaties (vakanties/feestdagen)
        const situatiesResponse = await fetch(`${API_URL}${situatiesEndpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1'
          }
        })
        
        if (!situatiesResponse.ok) {
          throw new Error(`Failed to fetch ${templateType.toLowerCase()} situaties`)
        }
        
        const situatiesData = await situatiesResponse.json()
        let situatiesArray = Array.isArray(situatiesData) ? situatiesData : (situatiesData.data || [])
        
        if (!Array.isArray(situatiesArray)) {
          situatiesArray = []
        }
        
        // Filter and map to ensure valid data
        situatiesArray = situatiesArray.filter((item: any) => 
          item && 
          typeof item === 'object' && 
          item.id && 
          item.naam
        ).map((item: any) => ({
          id: item.id,
          naam: item.naam,
          startDatum: item.startDatum || item.start_datum,
          eindDatum: item.eindDatum || item.eind_datum,
          type: templateType
        }))
        
        setSituaties(situatiesArray)

        // Load regeling templates
        try {
          const templateParams = new URLSearchParams({
            type: templateType,
            meervoudKinderen: hasMultipleKinderen.toString()
          })
          
          const templatesResponse = await fetch(
            `${API_URL}/api/lookups/regelingen-templates?${templateParams}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': '1'
              }
            }
          )
          
          if (!templatesResponse.ok) {
            console.warn('Failed to fetch regelingen templates, continuing without templates')
            setRegelingTemplates([])
          } else {
            const templatesData = await templatesResponse.json()
            
            let templatesArray = templatesData?.data || templatesData || []
            
            if (!Array.isArray(templatesArray)) {
              templatesArray = []
            }
            
            // Filter and map templates
            templatesArray = templatesArray.filter((template: any) => 
              template && 
              typeof template === 'object' && 
              template.id && 
              template.templateNaam
            ).map((template: any) => ({
              id: template.id,
              naam: template.templateNaam,
              templateText: template.templateTekst || template.templateText,
              type: template.type,
              meervoudKinderen: template.meervoudKinderen
            }))
            
            setRegelingTemplates(templatesArray)
          }
        } catch (templateError) {
          console.warn('Error fetching regelingen templates:', templateError)
          setRegelingTemplates([])
        } finally {
          setTemplatesLoaded(true)
        }

        // Initialize zorgRegelingen
        const initialRegelingen = situatiesArray.map((situatie: ZorgSituatie) => ({
          situatieId: situatie.id,
          regelingTemplateId: null
        }))
        setZorgRegelingen(initialRegelingen)
        
      } catch (error) {
        console.error('Error loading data:', error)
        notifications.show({
          title: 'Waarschuwing',
          message: `${title} zijn geladen, maar regelingen konden niet worden opgehaald`,
          color: 'yellow'
        })
      } finally {
        setLoading(false)
      }
    }

    const loadExistingZorgRegelingen = async () => {
      if (!dossierId) return
      
      try {
        const existingZorgRegelingen = await zorgService.getZorgRegelingen(dossierId, zorgCategorieId)
        
        
        if (existingZorgRegelingen.length > 0) {
          const mappedRegelingen = existingZorgRegelingen.map((zorgRecord) => {
            const situatieId = zorgRecord.zorgSituatie?.id || zorgRecord.zorgSituatieId
            
            // Check if this is a custom regeling
            if (situatieId === 15 && zorgRecord.situatieAnders) {
              // Custom regeling
              return {
                situatieId: 15,
                regelingTemplateId: null, // Will try to match template later
                zorgId: zorgRecord.id,
                overeenkomst: zorgRecord.overeenkomst,
                customNaam: zorgRecord.situatieAnders,
                tempId: Date.now() + Math.random() // Unique tempId for existing custom
              }
            } else {
              // Normal regeling
              let templateId = null
              const matchingTemplate = regelingTemplates.find(template => {
                const situatie = situaties.find(s => s.id === situatieId)
                if (!situatie) return false
                const processedText = getProcessedTemplateText(template, situatie)
                return processedText === zorgRecord.overeenkomst
              })
              templateId = matchingTemplate?.id || null
              
              return {
                situatieId: situatieId as number,
                regelingTemplateId: templateId,
                zorgId: zorgRecord.id,
                overeenkomst: zorgRecord.overeenkomst
              }
            }
          }).filter((regeling) => regeling.situatieId)
          
          
          // Update zorgRegelingen with existing data
          setZorgRegelingen(prev => {
            // First, add all custom regelingen from API
            const customFromAPI = mappedRegelingen.filter(r => r.situatieId === 15)
            
            // Then update normal regelingen
            const updated = prev.map(regeling => {
              if (regeling.situatieId !== 15) {
                const existing = mappedRegelingen.find((m) => m.situatieId === regeling.situatieId)
                if (existing) {
                  return {
                    ...regeling,
                    regelingTemplateId: existing.regelingTemplateId,
                    zorgId: existing.zorgId,
                    overeenkomst: existing.overeenkomst
                  }
                }
              }
              return regeling
            })
            
            // Add custom regelingen at the end
            return [...updated, ...customFromAPI]
          })
        }
      } catch (error) {
        console.error('Error loading existing zorg regelingen:', error)
      }
    }

    const updateZorgRegeling = (situatieId: number, regelingTemplateId: number | null) => {
      setZorgRegelingen(prev => 
        prev.map(regeling => 
          regeling.situatieId === situatieId 
            ? { ...regeling, regelingTemplateId }
            : regeling
        )
      )
    }

    const addCustomRegeling = () => {
      const newRegeling: ZorgRegeling = {
        situatieId: 15,
        regelingTemplateId: null,
        customNaam: '',
        tempId: Date.now()
      }
      setZorgRegelingen(prev => [...prev, newRegeling])
    }

    const removeCustomRegeling = (tempId: number) => {
      setZorgRegelingen(prev => prev.filter(r => r.tempId !== tempId))
    }

    const updateCustomNaam = (tempId: number, customNaam: string) => {
      setZorgRegelingen(prev => 
        prev.map(regeling => 
          regeling.tempId === tempId 
            ? { ...regeling, customNaam }
            : regeling
        )
      )
    }

    const openTemplateModal = (situatieId: number, tempId?: number) => {
      setActiveSituatieId(situatieId)
      setActiveTempId(tempId || null)
      const currentRegeling = zorgRegelingen.find(r => 
        tempId ? r.tempId === tempId : r.situatieId === situatieId
      )
      modal.open(currentRegeling?.regelingTemplateId)
    }

    const saveZorgData = async () => {
      if (!dossierId) return

      try {
        for (const regeling of zorgRegelingen) {
          const situatie = situaties.find(s => s.id === regeling.situatieId)
          const template = regelingTemplates.find(t => t.id === regeling.regelingTemplateId)
          
          if (regeling.situatieId === 15) {
            // Custom regeling
            if (regeling.customNaam && (regeling.regelingTemplateId || regeling.overeenkomst)) {
              const template = regelingTemplates.find(t => t.id === regeling.regelingTemplateId)
              const overeenkomstText = template 
                ? getProcessedTemplateText(template, { id: 15, naam: regeling.customNaam, type: templateType })
                : regeling.overeenkomst || ''
              
              const zorgData = {
                id: regeling.zorgId,
                zorgCategorieId: zorgCategorieId,
                zorgSituatieId: 15,
                situatieAnders: regeling.customNaam,
                overeenkomst: overeenkomstText
              }
              
              const savedRegeling = await zorgService.saveOrUpdateZorgRegeling(dossierId, zorgData)
              
              // Update the zorgId in our local state
              setZorgRegelingen(prev =>
                prev.map(r =>
                  r.tempId === regeling.tempId
                    ? { ...r, zorgId: savedRegeling.id }
                    : r
                )
              )
            }
          } else if (regeling.regelingTemplateId && situatie && template) {
            // Normal regeling
            const overeenkomstText = getProcessedTemplateText(template, situatie)
            
            const zorgData = {
              id: regeling.zorgId,
              zorgCategorieId: zorgCategorieId,
              zorgSituatieId: regeling.situatieId,
              overeenkomst: overeenkomstText
            }
            
            const savedRegeling = await zorgService.saveOrUpdateZorgRegeling(dossierId, zorgData)
            
            // Update the zorgId in our local state
            setZorgRegelingen(prev =>
              prev.map(r =>
                r.situatieId === regeling.situatieId
                  ? { ...r, zorgId: savedRegeling.id }
                  : r
              )
            )
          } else if (regeling.zorgId && !regeling.regelingTemplateId) {
            // Delete if no template selected
            await zorgService.deleteZorgRegeling(dossierId, regeling.zorgId)
            
            setZorgRegelingen(prev =>
              prev.map(r =>
                r.situatieId === regeling.situatieId
                  ? { ...r, zorgId: undefined }
                  : r
              )
            )
          }
        }
        
        notifications.show({
          title: 'Succes',
          message: `${title} regelingen opgeslagen`,
          color: 'green'
        })
      } catch (error) {
        console.error('Error saving zorg regelingen:', error)
        notifications.show({
          title: 'Fout',
          message: `Kon ${title.toLowerCase()} regelingen niet opslaan`,
          color: 'red'
        })
      }
    }

    const getProcessedTemplateText = (template: RegelingTemplate, situatie: ZorgSituatie) => {
      const childrenNames = kinderen.map(item => {
        const child = item.kind || item
        return child.roepnaam || child.voornamen || 'Kind'
      })
      
      const kindText = formatDutchNameList(childrenNames)
      
      // Get custom variables from props or use defaults
      const variables = getTemplateVariables ? getTemplateVariables(situatie) : {
        [templateType.toLowerCase()]: situatie.naam,
        kind: kindText,
        partij1: partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
        partij2: partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
      }
      
      return processTemplateText(template.templateText, {
        variables,
        customReplacements: createDutchPluralReplacements(hasMultipleKinderen)
      })
    }

    if (loading) {
      return (
        <Container>
          <Stack align="center" mt="xl">
            <Loader />
            <Text>{title} gegevens laden...</Text>
          </Stack>
        </Container>
      )
    }

    return (
      <Container>
        <Title order={2} mb="lg">{title}</Title>
        
        <Stack gap="md">
          {/* Normal situaties */}
          {situaties.map(situatie => {
            const regeling = zorgRegelingen.find(r => r.situatieId === situatie.id && !r.tempId)
            const selectedTemplate = regelingTemplates.find(t => t.id === regeling?.regelingTemplateId)
            
            return (
              <Card key={situatie.id} shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start" mb="md">
                  <Stack gap="xs">
                    <Text fw={500} size="lg">{situatie.naam}</Text>
                    {getSituatieLabel && (
                      <Text size="sm" c="dimmed">
                        {getSituatieLabel(situatie)}
                      </Text>
                    )}
                  </Stack>
                  
                  <Button
                    variant={selectedTemplate ? "light" : "default"}
                    leftSection={<IconEdit size={16} />}
                    onClick={() => openTemplateModal(situatie.id)}
                    disabled={regelingTemplates.length === 0}
                  >
                    {selectedTemplate ? "Wijzig regeling" : "Selecteer regeling"}
                  </Button>
                </Group>
                
                {(selectedTemplate || regeling?.zorgId) && (
                  <Card withBorder p="md" bg="gray.0">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTemplate 
                        ? getProcessedTemplateText(selectedTemplate, situatie)
                        : regeling?.overeenkomst || 'Bestaande regeling laden...'}
                    </Text>
                  </Card>
                )}
              </Card>
            )
          })}
          
          {/* Custom regelingen */}
          {zorgRegelingen
            .filter(r => r.situatieId === 15)
            .map(regeling => {
              const selectedTemplate = regelingTemplates.find(t => t.id === regeling.regelingTemplateId)
              
              return (
                <Card key={regeling.tempId} shadow="sm" p="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <TextInput
                        placeholder="Naam van de situatie"
                        value={regeling.customNaam || ''}
                        onChange={(e) => updateCustomNaam(regeling.tempId!, e.currentTarget.value)}
                        fw={500}
                        size="lg"
                        style={{ fontWeight: 500 }}
                      />
                    </Stack>
                    
                    <Group gap="xs">
                      <Button
                        variant={selectedTemplate ? "light" : "default"}
                        leftSection={<IconEdit size={16} />}
                        onClick={() => openTemplateModal(15, regeling.tempId)}
                        disabled={regelingTemplates.length === 0}
                      >
                        {selectedTemplate ? "Wijzig regeling" : "Selecteer regeling"}
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeCustomRegeling(regeling.tempId!)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  
                  {(selectedTemplate || regeling.zorgId) && regeling.customNaam && (
                    <Card withBorder p="md" bg="gray.0">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedTemplate 
                          ? getProcessedTemplateText(selectedTemplate, { 
                              id: 15, 
                              naam: regeling.customNaam, 
                              type: templateType 
                            })
                          : regeling.overeenkomst || 'Bestaande regeling laden...'}
                      </Text>
                    </Card>
                  )}
                </Card>
              )
            })}
          
          {/* Add new custom regeling button */}
          <Button
            variant="default"
            leftSection={<IconPlus size={16} />}
            onClick={addCustomRegeling}
          >
            Nieuwe regeling toevoegen
          </Button>
          
          {situaties.length === 0 && zorgRegelingen.filter(r => r.situatieId === 15).length === 0 && (
            <Card withBorder p="xl">
              <Text ta="center" c="dimmed">
                Geen {title.toLowerCase()} gevonden
              </Text>
            </Card>
          )}
        </Stack>

        <RegelingTemplateSelectModal
          opened={modal.isOpen}
          onClose={modal.close}
          onSelect={modal.handleSelect}
          templates={regelingTemplates}
          selectedTemplateId={modal.selectedTemplateId}
          title={`Selecteer een ${templateType.toLowerCase()}regeling`}
          loading={false}
          templateContext={(() => {
            let situatie = situaties.find(s => s.id === activeSituatieId)
            
            // For custom regelingen, create a virtual situatie
            if (activeSituatieId === 15 && activeTempId) {
              const customRegeling = zorgRegelingen.find(r => r.tempId === activeTempId)
              if (customRegeling) {
                situatie = {
                  id: 15,
                  naam: customRegeling.customNaam || '',
                  type: templateType
                }
              }
            }
            
            const childrenNames = kinderen.map(item => {
              const child = item.kind || item
              return child.roepnaam || child.voornamen || 'Kind'
            })
            
            const variables = getTemplateVariables && situatie ? getTemplateVariables(situatie) : {
              [templateType.toLowerCase()]: situatie?.naam || '',
              kind: formatDutchNameList(childrenNames),
              partij1: partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
              partij2: partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
            }
            
            return variables
          })()}
          customReplacements={createDutchPluralReplacements(hasMultipleKinderen)}
          emptyMessage={`Geen ${templateType.toLowerCase()}regeling templates beschikbaar`}
        />
      </Container>
    )
  }
)