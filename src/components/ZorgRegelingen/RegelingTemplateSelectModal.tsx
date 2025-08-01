import { useState, useEffect, useMemo } from 'react'
import {
  Modal,
  TextInput,
  Card,
  Text,
  Stack,
  Group,
  Button,
  ScrollArea,
  Loader,
  Alert,
  Grid,
} from '@mantine/core'
import { IconSearch, IconCheck } from '@tabler/icons-react'
import { processTemplateText, TemplateContext } from '../../utils/templateProcessor'

export interface RegelingTemplate {
  id: number
  naam: string
  templateText: string
  type: 'Vakantie' | 'Feestdag' | 'Anders' | 'Algemeen'
  meervoudKinderen: boolean
}

interface RegelingTemplateSelectModalProps {
  opened: boolean
  onClose: () => void
  onSelect: (template: RegelingTemplate) => void
  templates: RegelingTemplate[]
  selectedTemplateId?: number | null
  title?: string
  loading?: boolean
  error?: string | null
  templateContext?: TemplateContext
  customReplacements?: Record<string, string>
  emptyMessage?: string
}

export function RegelingTemplateSelectModal({
  opened,
  onClose,
  onSelect,
  templates,
  selectedTemplateId,
  title = 'Selecteer een regeling template',
  loading = false,
  error = null,
  templateContext = {},
  customReplacements,
  emptyMessage = 'Geen templates beschikbaar'
}: RegelingTemplateSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<RegelingTemplate | null>(null)

  useEffect(() => {
    if (opened && selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      setSelectedTemplate(template || null)
    }
  }, [opened, selectedTemplateId, templates])

  const getProcessedText = (template: RegelingTemplate) => {
    return processTemplateText(template.templateText, {
      variables: templateContext,
      customReplacements
    })
  }

  // Process templates with context for searching and display
  const processedTemplates = useMemo(() => {
    return templates.map(template => ({
      ...template,
      processedText: getProcessedText(template)
    }))
  }, [templates, templateContext, customReplacements])

  // Filter and sort templates based on processed text
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = processedTemplates
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(template => {
        const nameMatch = template.naam.toLowerCase().includes(searchLower)
        const textMatch = template.processedText.toLowerCase().includes(searchLower)
        return nameMatch || textMatch
      })
    }
    
    // Sort by processed text (description)
    return filtered.sort((a, b) => a.processedText.localeCompare(b.processedText))
  }, [processedTemplates, searchQuery])

  const handleSelect = (template: RegelingTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
      onClose()
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack>
        <TextInput
          placeholder="Zoek op naam of inhoud..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          disabled={loading}
        />

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : error ? (
          <Alert color="red">{error}</Alert>
        ) : (
          <>
            <ScrollArea h={400} type="auto">
              {filteredAndSortedTemplates.length === 0 ? (
                <Text ta="center" py="xl" c="dimmed">
                  {searchQuery ? 'Geen templates gevonden' : emptyMessage}
                </Text>
              ) : (
                <Grid gutter="md">
                  {filteredAndSortedTemplates.map((template) => (
                    <Grid.Col span={12} key={template.id}>
                      <Card
                        shadow="sm"
                        p="lg"
                        radius="md"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id 
                            ? '2px solid var(--mantine-color-blue-5)' 
                            : undefined
                        }}
                        onClick={() => handleSelect(template)}
                      >
                       
                        
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} >
                          {template.processedText}
                        </Text>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </ScrollArea>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                Annuleren
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!selectedTemplate}
                leftSection={<IconCheck size={16} />}
              >
                Selecteren
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}