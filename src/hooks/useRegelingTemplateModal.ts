import { useState, useCallback } from 'react'
import { RegelingTemplate } from '../components/RegelingTemplateSelectModal'

interface UseRegelingTemplateModalOptions {
  onSelect?: (template: RegelingTemplate) => void
}

export function useRegelingTemplateModal(options?: UseRegelingTemplateModalOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const open = useCallback((currentTemplateId?: number | null) => {
    if (currentTemplateId) {
      setSelectedTemplateId(currentTemplateId)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleSelect = useCallback((template: RegelingTemplate) => {
    setSelectedTemplateId(template.id)
    if (options?.onSelect) {
      options.onSelect(template)
    }
    close()
  }, [options, close])

  return {
    isOpen,
    open,
    close,
    handleSelect,
    selectedTemplateId
  }
}