import React, { useState, useEffect, useImperativeHandle } from 'react'
import {
  Container,
  Title,
  Stack,
  Card,
  Text,
  Group,
  Loader,
  Button
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconEdit } from '@tabler/icons-react'
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

    const modal = useRegelingTemplateModal({
      onSelect: (template) => {
        if (activeSituatieId) {
          updateZorgRegeling(activeSituatieId, template.id)
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
            
            // Try to find a template that matches the overeenkomst text
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
          }).filter((regeling) => regeling.situatieId)
          
          
          // Update zorgRegelingen with existing data
          setZorgRegelingen(prev => {
            const updated = prev.map(regeling => {
              const existing = mappedRegelingen.find((m) => m.situatieId === regeling.situatieId)
              if (existing) {
                return {
                  ...regeling,
                  regelingTemplateId: existing.regelingTemplateId,
                  zorgId: existing.zorgId,
                  overeenkomst: existing.overeenkomst
                }
              }
              return regeling
            })
            return updated
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

    const openTemplateModal = (situatieId: number) => {
      setActiveSituatieId(situatieId)
      const currentRegeling = zorgRegelingen.find(r => r.situatieId === situatieId)
      modal.open(currentRegeling?.regelingTemplateId)
    }

    const saveZorgData = async () => {
      if (!dossierId) return

      try {
        for (const regeling of zorgRegelingen) {
          const situatie = situaties.find(s => s.id === regeling.situatieId)
          const template = regelingTemplates.find(t => t.id === regeling.regelingTemplateId)
          
          if (regeling.regelingTemplateId && situatie && template) {
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
          {situaties.map(situatie => {
            const regeling = zorgRegelingen.find(r => r.situatieId === situatie.id)
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
          
          {situaties.length === 0 && (
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
            const situatie = situaties.find(s => s.id === activeSituatieId)
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