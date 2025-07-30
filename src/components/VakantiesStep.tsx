import React, { useState, useEffect, useImperativeHandle } from 'react'
import {
  Container,
  Title,
  Select,
  Stack,
  Card,
  Text,
  Group,
  Loader
} from '@mantine/core'
import { notifications } from '@mantine/notifications'

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
  type: 'Vakantie' | 'Feestdag'
  meervoudKinderen: boolean
}

interface VakantieRegeling {
  vakantieId: number
  regelingTemplateId: number | null
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

    const hasMultipleKinderen = kinderen.length > 1

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

    const getHeaders = (): HeadersInit => {
      return {
        'Content-Type': 'application/json',
        'x-user-id': '1'
      }
    }

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load school holidays
        const vakantiesResponse = await fetch(`${API_URL}/api/lookups/schoolvakanties`, {
          headers: getHeaders()
        })
        
        if (!vakantiesResponse.ok) {
          throw new Error('Failed to fetch schoolvakanties')
        }
        
        const vakantiesData = await vakantiesResponse.json()
        let vakantiesArray = vakantiesData?.data || vakantiesData || []
        
        // Ensure we have a valid array
        if (!Array.isArray(vakantiesArray)) {
          vakantiesArray = []
        }
        
        // Filter out any invalid entries
        vakantiesArray = vakantiesArray.filter((vakantie: any) => 
          vakantie && 
          typeof vakantie === 'object' && 
          vakantie.id && 
          vakantie.naam
        )
        
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
              headers: getHeaders()
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
        }

        // Initialize vakantieRegelingen
        const initialRegelingen = vakantiesArray.map((vakantie: Vakantie) => ({
          vakantieId: vakantie.id,
          regelingTemplateId: null
        }))
        setVakantieRegelingen(initialRegelingen)

        // Load existing data if dossierId exists
        if (dossierId) {
          await loadExistingVakantieRegelingen()
        }
        
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
        // TODO: Implement API call to load existing vakantie regelingen
        // const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/vakantie-regelingen`, {
        //   headers: getHeaders()
        // })
        // const data = await response.json()
        // Update vakantieRegelingen with existing data
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

    const saveVakantieData = async () => {
      if (!dossierId) return

      try {
        // TODO: Implement API call to save vakantie regelingen
        // for (const regeling of vakantieRegelingen) {
        //   if (regeling.regelingTemplateId) {
        //     await fetch(`${API_URL}/api/dossiers/${dossierId}/vakantie-regelingen`, {
        //       method: 'POST',
        //       headers: getHeaders(),
        //       body: JSON.stringify(regeling)
        //     })
        //   }
        // }
        
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
      let text = template.templateText
      
      // Replace variables with actual values (handle both uppercase and lowercase)
      const replacements: Record<string, string> = {
        '{VAKANTIE}': vakantie.naam,
        '{vakantie}': vakantie.naam,
        '{KIND}': hasMultipleKinderen ? 'de kinderen' : 'het kind',
        '{kind}': hasMultipleKinderen ? 'de kinderen' : 'het kind',
        '{Kind}': hasMultipleKinderen ? 'De kinderen' : 'Het kind',
        '{zijn/haar}': hasMultipleKinderen ? 'hun' : 'zijn/haar',
        '{is/zijn}': hasMultipleKinderen ? 'zijn' : 'is',
        '{verblijft/verblijven}': hasMultipleKinderen ? 'verblijven' : 'verblijft',
        '{PARTIJ1}': partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
        '{PARTIJ2}': partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2',
        '{partij1}': partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
        '{partij2}': partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
      }
      
      Object.entries(replacements).forEach(([variable, value]) => {
        text = text.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'gi'), value)
      })
      
      return text
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
                  
                  <Select
                    placeholder={regelingTemplates.length === 0 ? "Geen regelingen beschikbaar" : "Selecteer regeling"}
                    data={regelingTemplates
                      .filter(template => template && template.id && template.naam)
                      .map(template => ({
                        value: template.id.toString(),
                        label: template.naam || 'Onbekende regeling'
                      }))}
                    value={regeling?.regelingTemplateId?.toString() || null}
                    onChange={(value) => updateVakantieRegeling(
                      vakantie.id,
                      value ? parseInt(value) : null
                    )}
                    style={{ minWidth: 400 }}
                    clearable
                    disabled={regelingTemplates.length === 0}
                    searchable={false}
                  />
                </Group>
                
                {selectedTemplate && (
                  <Card withBorder p="md" bg="gray.0">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {getProcessedTemplateText(selectedTemplate, vakantie)}
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
      </Container>
    )
  }
)