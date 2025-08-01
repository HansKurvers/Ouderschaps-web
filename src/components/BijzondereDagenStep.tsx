import React from 'react'
import { ZorgRegelingenStep, ZorgSituatie } from './ZorgRegelingenStep'

interface BijzondereDagenStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: any[]) => void
}

export interface BijzondereDagenStepHandle {
  saveData: () => Promise<void>
}

export const BijzondereDagenStep = React.forwardRef<BijzondereDagenStepHandle, BijzondereDagenStepProps>(
  (props, ref) => {
    const getSituatieLabel = (bijzonderedag: ZorgSituatie) => {
      if (bijzonderedag.startDatum) {
        return new Date(bijzonderedag.startDatum).toLocaleDateString('nl-NL')
      }
      return ''
    }

    const getTemplateVariables = (bijzonderedag: ZorgSituatie) => {
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
        feestdag: bijzonderedag.naam, // Gebruik feestdag variabele omdat we feestdag templates gebruiken
        kind: kindText,
        partij1: props.partij1?.persoon?.roepnaam || props.partij1?.persoon?.voornamen || 'Partij 1',
        partij2: props.partij2?.persoon?.roepnaam || props.partij2?.persoon?.voornamen || 'Partij 2'
      }
    }

    return (
      <ZorgRegelingenStep
        ref={ref}
        {...props}
        zorgCategorieId={10}
        title="Bijzondere dagen"
        situatiesEndpoint="/api/lookups/zorg-situaties?categorieId=10"
        templateType="Feestdag" // Gebruik Feestdag templates zoals gevraagd
        getSituatieLabel={getSituatieLabel}
        getTemplateVariables={getTemplateVariables}
      />
    )
  }
)