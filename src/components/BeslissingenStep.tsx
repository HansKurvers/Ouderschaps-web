import React from 'react'
import { ZorgRegelingenStep, ZorgSituatie } from './ZorgRegelingenStep'

interface BeslissingenStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: any[]) => void
}

export interface BeslissingenStepHandle {
  saveData: () => Promise<void>
}

export const BeslissingenStep = React.forwardRef<BeslissingenStepHandle, BeslissingenStepProps>(
  (props, ref) => {
    const getSituatieLabel = (beslissing: ZorgSituatie) => {
      if (beslissing.startDatum) {
        return new Date(beslissing.startDatum).toLocaleDateString('nl-NL')
      }
      return ''
    }

    const getTemplateVariables = (beslissing: ZorgSituatie) => {
      const childrenNames = props.kinderen?.map(item => {
        const child = item.kind || item
        return child.roepnaam || child.voornamen || 'Kind'
      }) || []
      
      const kindText = childrenNames.length === 0 
        ? 'het kind'
        : childrenNames.length === 1 
          ? childrenNames[0]
          : childrenNames.length === 2
            ? `${childrenNames[0]} en ${childrenNames[1]}`
            : `${childrenNames.slice(0, -1).join(', ')} en ${childrenNames[childrenNames.length - 1]}`
      
      return {
        beslissing: beslissing.naam,
        kind: kindText,
        partij1: props.partij1?.persoon?.roepnaam || props.partij1?.persoon?.voornamen || 'Partij 1',
        partij2: props.partij2?.persoon?.roepnaam || props.partij2?.persoon?.voornamen || 'Partij 2'
      }
    }

    return (
      <ZorgRegelingenStep
        ref={ref}
        {...props}
        zorgCategorieId={-1} // Special value to indicate "all other categories"
        title="Beslissingen"
        situatiesEndpoint="/api/lookups/zorg-situaties?excludeCategories=6,9,10"
        templateType="Algemeen"
        getSituatieLabel={getSituatieLabel}
        getTemplateVariables={getTemplateVariables}
        enableCategoryGrouping={true}
        allowCustomFields={true}
      />
    )
  }
)