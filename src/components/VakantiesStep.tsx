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
  formatDutchNameList 
} from '../utils/templateProcessor'

interface Vakantie {
  id: number
  naam: string
  startDatum: string
  eindDatum: string
  type: string
}

interface RegelingTemplate {
  id: number
  naam: string
  templateText: string
  type: 'Vakantie' | 'Feestdag' | 'Anders'
  meervoudKinderen: boolean
}

interface VakantieRegeling {
  vakantieId: number
  regelingTemplateId: number | null
  zorgId?: string
  overeenkomst?: string
}

interface VakantiesStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: VakantieRegeling[]) => void
}

export interface VakantiesStepHandle {
  saveData: () => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const VakantiesStep = React.forwardRef<VakantiesStepHandle, VakantiesStepProps>(
  ({ dossierId, kinderen = [], partij1, partij2, onDataChange }, ref) => {
    const [vakanties, setVakanties] = useState<Vakantie[]>([])
    const [regelingTemplates, setRegelingTemplates] = useState<RegelingTemplate[]>([])
    const [vakantieRegelingen, setVakantieRegelingen] = useState<VakantieRegeling[]>([])
    const [loading, setLoading] = useState(true)
    const [activeVakantieId, setActiveVakantieId] = useState<number | null>(null)
    const [templatesLoaded, setTemplatesLoaded] = useState(false)

    const hasMultipleKinderen = kinderen.length > 1

    const modal = useRegelingTemplateModal({
      onSelect: (template) => {
        if (activeVakantieId) {
          updateVakantieRegeling(activeVakantieId, template.id)
        }
      }
    })

    useImperativeHandle(ref, () => ({
      saveData: saveVakantieData
    }))

    useEffect(() => {
      loadData()
    }, [hasMultipleKinderen])

    useEffect(() => {
      if (onDataChange) {
        onDataChange(vakantieRegelingen)
      }
    }, [vakantieRegelingen, onDataChange])

    // Load existing data when both vakanties and templates are loaded
    useEffect(() => {
      if (dossierId && vakanties.length > 0 && !loading && templatesLoaded) {
        loadExistingVakantieRegelingen()
      }
    }, [dossierId, vakanties.length, loading, templatesLoaded])


    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load school holidays from zorg-situaties endpoint with categorieId = 6
        const vakantiesResponse = await fetch(`${API_URL}/api/lookups/zorg-situaties?categorieId=6`, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1'
          }
        })
        
        if (!vakantiesResponse.ok) {
          throw new Error('Failed to fetch schoolvakanties')
        }
        
        const vakantiesData = await vakantiesResponse.json()
        
        // The response is an array of care situations (which are vakanties in this case)
        let vakantiesArray = Array.isArray(vakantiesData) ? vakantiesData : (vakantiesData.data || [])
        
        // Ensure we have a valid array
        if (!Array.isArray(vakantiesArray)) {
          vakantiesArray = []
        }
        
        // Map zorg situaties to vakantie structure
        vakantiesArray = vakantiesArray.filter((item: any) => 
          item && 
          typeof item === 'object' && 
          item.id && 
          item.naam
        ).map((item: any) => ({
          id: item.id,
          naam: item.naam,
          startDatum: item.startDatum || item.start_datum,
          eindDatum: item.eindDatum || item.eind_datum,
          type: 'Vakantie'
        }))
        
        setVakanties(vakantiesArray)

        // Load regeling templates with appropriate filters
        try {
          const templateParams = new URLSearchParams({
            type: 'Vakantie',
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
            
            // Ensure we have a valid array with valid objects
            if (!Array.isArray(templatesArray)) {
              templatesArray = []
            }
            
            // Filter out any invalid entries and map to expected structure
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

        // Initialize vakantieRegelingen
        const initialRegelingen = vakantiesArray.map((vakantie: Vakantie) => ({
          vakantieId: vakantie.id,
          regelingTemplateId: null
        }))
        setVakantieRegelingen(initialRegelingen)
        
      } catch (error) {
        console.error('Error loading data:', error)
        notifications.show({
          title: 'Waarschuwing',
          message: 'Vakanties zijn geladen, maar regelingen konden niet worden opgehaald',
          color: 'yellow'
        })
      } finally {
        setLoading(false)
      }
    }

    const loadExistingVakantieRegelingen = async () => {
      if (!dossierId) return
      
      try {
        // Load existing vakantie regelingen from zorg endpoint
        const existingZorgRegelingen = await zorgService.getZorgRegelingen(dossierId, 6)
        
        console.log('Loading existing regelingen:', existingZorgRegelingen)
        
        if (existingZorgRegelingen.length > 0) {
          // Map existing zorg records back to vakantieRegelingen
          const mappedRegelingen = existingZorgRegelingen.map((zorgRecord) => {
            // Try to match the zorgSituatieId with a vakantie ID
            const vakantieId = zorgRecord.zorgSituatie?.id || zorgRecord.zorgSituatieId
            
            // Try to find a template that matches the overeenkomst text
            let templateId = null
            const matchingTemplate = regelingTemplates.find(template => {
              const vakantie = vakanties.find(v => v.id === vakantieId)
              if (!vakantie) return false
              const processedText = getProcessedTemplateText(template, vakantie)
              return processedText === zorgRecord.overeenkomst
            })
            templateId = matchingTemplate?.id || null
            
            console.log(`Mapping zorg record: vakantieId=${vakantieId}, templateId=${templateId}, zorgId=${zorgRecord.id}`)
            
            return {
              vakantieId: vakantieId as number,
              regelingTemplateId: templateId,
              zorgId: zorgRecord.id,
              overeenkomst: zorgRecord.overeenkomst
            }
          }).filter((regeling) => regeling.vakantieId)
          
          console.log('Mapped regelingen:', mappedRegelingen)
          
          // Update vakantieRegelingen with existing data
          setVakantieRegelingen(prev => {
            const updated = prev.map(regeling => {
              const existing = mappedRegelingen.find((m) => m.vakantieId === regeling.vakantieId)
              if (existing) {
                // Merge existing data with current state
                return {
                  ...regeling,
                  regelingTemplateId: existing.regelingTemplateId,
                  zorgId: existing.zorgId,
                  overeenkomst: existing.overeenkomst
                }
              }
              return regeling
            })
            console.log('Updated vakantieRegelingen:', updated)
            return updated
          })
        }
      } catch (error) {
        console.error('Error loading existing vakantie regelingen:', error)
      }
    }

    const updateVakantieRegeling = (vakantieId: number, regelingTemplateId: number | null) => {
      setVakantieRegelingen(prev => 
        prev.map(regeling => 
          regeling.vakantieId === vakantieId 
            ? { ...regeling, regelingTemplateId }
            : regeling
        )
      )
    }

    const openTemplateModal = (vakantieId: number) => {
      setActiveVakantieId(vakantieId)
      const currentRegeling = vakantieRegelingen.find(r => r.vakantieId === vakantieId)
      modal.open(currentRegeling?.regelingTemplateId)
    }

    const saveVakantieData = async () => {
      if (!dossierId) return

      try {
        // Save or update each vakantie regeling using the zorg service
        for (const regeling of vakantieRegelingen) {
          const vakantie = vakanties.find(v => v.id === regeling.vakantieId)
          const template = regelingTemplates.find(t => t.id === regeling.regelingTemplateId)
          
          if (regeling.regelingTemplateId && vakantie && template) {
            const overeenkomstText = getProcessedTemplateText(template, vakantie)
            
            const zorgData = {
              id: regeling.zorgId,
              zorgCategorieId: 6, // Vakantie category
              zorgSituatieId: regeling.vakantieId, // Use vakantie ID as situation ID
              overeenkomst: overeenkomstText
            }
            
            const savedRegeling = await zorgService.saveOrUpdateZorgRegeling(dossierId, zorgData)
            
            // Update the zorgId in our local state
            setVakantieRegelingen(prev =>
              prev.map(r =>
                r.vakantieId === regeling.vakantieId
                  ? { ...r, zorgId: savedRegeling.id }
                  : r
              )
            )
          } else if (regeling.zorgId && !regeling.regelingTemplateId) {
            // If there's a zorgId but no template selected, delete the regeling
            await zorgService.deleteZorgRegeling(dossierId, regeling.zorgId)
            
            // Remove the zorgId from local state
            setVakantieRegelingen(prev =>
              prev.map(r =>
                r.vakantieId === regeling.vakantieId
                  ? { ...r, zorgId: undefined }
                  : r
              )
            )
          }
        }
        
        notifications.show({
          title: 'Succes',
          message: 'Vakantie regelingen opgeslagen',
          color: 'green'
        })
      } catch (error) {
        console.error('Error saving vakantie regelingen:', error)
        notifications.show({
          title: 'Fout',
          message: 'Kon vakantie regelingen niet opslaan',
          color: 'red'
        })
      }
    }


    const getProcessedTemplateText = (template: RegelingTemplate, vakantie: Vakantie) => {
      // Get children names from the nested structure
      const childrenNames = kinderen.map(item => {
        const child = item.kind || item
        return child.roepnaam || child.voornamen || 'Kind'
      })
      
      const kindText = formatDutchNameList(childrenNames)
      
      return processTemplateText(template.templateText, {
        variables: {
          vakantie: vakantie.naam,
          kind: kindText,
          partij1: partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
          partij2: partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
        },
        customReplacements: createDutchPluralReplacements(hasMultipleKinderen)
      })
    }

    if (loading) {
      return (
        <Container>
          <Stack align="center" mt="xl">
            <Loader />
            <Text>Vakantie gegevens laden...</Text>
          </Stack>
        </Container>
      )
    }

    return (
      <Container>
        <Title order={2} mb="lg">Vakantieregelingen</Title>
        
        <Stack gap="md">
          {vakanties.map(vakantie => {
            const regeling = vakantieRegelingen.find(r => r.vakantieId === vakantie.id)
            const selectedTemplate = regelingTemplates.find(t => t.id === regeling?.regelingTemplateId)
            
            
            return (
              <Card key={vakantie.id} shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start" mb="md">
                    <Stack gap="xs">
                      <Text fw={500} size="lg">{vakantie.naam}</Text>
                      {vakantie.startDatum && vakantie.eindDatum && (
                        <Text size="sm" c="dimmed">
                          {new Date(vakantie.startDatum).toLocaleDateString('nl-NL')} - {new Date(vakantie.eindDatum).toLocaleDateString('nl-NL')}
                        </Text>
                      )}
                    </Stack>
                  
                  <Button
                    variant={selectedTemplate ? "light" : "default"}
                    leftSection={<IconEdit size={16} />}
                    onClick={() => openTemplateModal(vakantie.id)}
                    disabled={regelingTemplates.length === 0}
                  >
                    {selectedTemplate ? "Wijzig regeling" : "Selecteer regeling"}
                  </Button>
                </Group>
                
                {(selectedTemplate || regeling?.zorgId) && (
                  <Card withBorder p="md" bg="gray.0">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTemplate 
                        ? getProcessedTemplateText(selectedTemplate, vakantie)
                        : regeling?.overeenkomst || 'Bestaande regeling laden...'}
                    </Text>
                  </Card>
                )}
              </Card>
            )
          })}
          
          {vakanties.length === 0 && (
            <Card withBorder p="xl">
              <Text ta="center" c="dimmed">
                Geen schoolvakanties gevonden
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
          title="Selecteer een vakantieregeling"
          loading={false}
          templateContext={(() => {
            const vakantie = vakanties.find(v => v.id === activeVakantieId)
            const childrenNames = kinderen.map(item => {
              const child = item.kind || item
              return child.roepnaam || child.voornamen || 'Kind'
            })
            
            return {
              vakantie: vakantie?.naam || '',
              kind: formatDutchNameList(childrenNames),
              partij1: partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
              partij2: partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
            }
          })()}
          customReplacements={createDutchPluralReplacements(hasMultipleKinderen)}
          emptyMessage="Geen vakantieregeling templates beschikbaar"
        />
      </Container>
    )
  }
)