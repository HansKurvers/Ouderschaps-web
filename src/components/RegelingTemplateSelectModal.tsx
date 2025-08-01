import { useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  Card,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  ScrollArea,
  Loader,
  Alert,
  Grid,
  Divider
} from '@mantine/core'
import { IconSearch, IconCheck } from '@tabler/icons-react'

export interface RegelingTemplate {
  id: number
  naam: string
  templateText: string
  type: 'Vakantie' | 'Feestdag' | 'Anders'
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
  processTemplateText?: (template: RegelingTemplate) => string
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
  processTemplateText,
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

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = template.naam.toLowerCase().includes(searchLower)
    const textMatch = template.templateText.toLowerCase().includes(searchLower)
    
    return nameMatch || textMatch
  })

  const handleSelect = (template: RegelingTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
      onClose()
    }
  }

  const getProcessedText = (template: RegelingTemplate) => {
    if (processTemplateText) {
      return processTemplateText(template)
    }
    return template.templateText
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
              {filteredTemplates.length === 0 ? (
                <Text ta="center" py="xl" c="dimmed">
                  {searchQuery ? 'Geen templates gevonden' : emptyMessage}
                </Text>
              ) : (
                <Grid gutter="md">
                  {filteredTemplates.map((template) => (
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
                       
                        
                        
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {getProcessedText(template)}
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