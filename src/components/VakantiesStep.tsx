import React, { useState, useEffect, useImperativeHandle } from 'react'
import {
  Container,
  Title,
  Select,
  Stack,
  Card,
  Text,
  Group,
  Badge,
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
        const vakantiesArray = vakantiesData?.data || vakantiesData || []
        setVakanties(vakantiesArray)

        // Load regeling templates with appropriate filters
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
          throw new Error('Failed to fetch regelingen templates')
        }
        
        const templatesData = await templatesResponse.json()
        const templatesArray = templatesData?.data || templatesData || []
        setRegelingTemplates(templatesArray)

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
          title: 'Fout',
          message: 'Kon vakantie gegevens niet laden',
          color: 'red'
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

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const getProcessedTemplateText = (template: RegelingTemplate) => {
      let text = template.templateText
      
      // Replace variables with actual values
      const replacements: Record<string, string> = {
        '{kind}': hasMultipleKinderen ? 'de kinderen' : 'het kind',
        '{Kind}': hasMultipleKinderen ? 'De kinderen' : 'Het kind',
        '{zijn/haar}': hasMultipleKinderen ? 'hun' : 'zijn/haar',
        '{is/zijn}': hasMultipleKinderen ? 'zijn' : 'is',
        '{verblijft/verblijven}': hasMultipleKinderen ? 'verblijven' : 'verblijft',
        '{partij1}': partij1?.persoon?.roepnaam || partij1?.persoon?.voornamen || 'Partij 1',
        '{partij2}': partij2?.persoon?.roepnaam || partij2?.persoon?.voornamen || 'Partij 2'
      }
      
      Object.entries(replacements).forEach(([variable, value]) => {
        text = text.replace(new RegExp(variable, 'g'), value)
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
                    <Text fw={500} size="lg">{vakantie.naam}</Text>
                   
                  
                  <Select
                    placeholder="Selecteer regeling"
                    data={regelingTemplates.map(template => ({
                      value: template.id.toString(),
                      label: template.naam
                    }))}
                    value={regeling?.regelingTemplateId?.toString() || null}
                    onChange={(value) => updateVakantieRegeling(
                      vakantie.id,
                      value ? parseInt(value) : null
                    )}
                    style={{ minWidth: 400 }}
                    clearable
                  />
                </Group>
                
                {selectedTemplate && (
                  <Card withBorder p="md" bg="gray.0">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {getProcessedTemplateText(selectedTemplate)}
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