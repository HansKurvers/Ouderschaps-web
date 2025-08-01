import React from 'react'
import { ZorgRegelingenStep, ZorgSituatie } from './ZorgRegelingenStep'

interface FeestdagenStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: any[]) => void
}

export interface FeestdagenStepHandle {
  saveData: () => Promise<void>
}

export const FeestdagenStep = React.forwardRef<FeestdagenStepHandle, FeestdagenStepProps>(
  (props, ref) => {
    const getSituatieLabel = (feestdag: ZorgSituatie) => {
      if (feestdag.startDatum) {
        return new Date(feestdag.startDatum).toLocaleDateString('nl-NL')
      }
      return ''
    }

    const getTemplateVariables = (feestdag: ZorgSituatie) => {
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
        feestdag: feestdag.naam,
        kind: kindText,
        partij1: props.partij1?.persoon?.roepnaam || props.partij1?.persoon?.voornamen || 'Partij 1',
        partij2: props.partij2?.persoon?.roepnaam || props.partij2?.persoon?.voornamen || 'Partij 2'
      }
    }

    return (
      <ZorgRegelingenStep
        ref={ref}
        {...props}
        zorgCategorieId={9}
        title="Feestdagenregelingen"
        situatiesEndpoint="/api/lookups/zorg-situaties?categorieId=9"
        templateType="Feestdag"
        getSituatieLabel={getSituatieLabel}
        getTemplateVariables={getTemplateVariables}
      />
    )
  }
)