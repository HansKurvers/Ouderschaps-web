import React from 'react'
import { ZorgRegelingenStep, ZorgSituatie } from './ZorgRegelingenStep'

interface VakantiesStepProps {
  dossierId?: string
  kinderen?: any[]
  partij1: { persoon: any | null }
  partij2: { persoon: any | null }
  onDataChange?: (data: any[]) => void
}

export interface VakantiesStepHandle {
  saveData: () => Promise<void>
}

export const VakantiesStep = React.forwardRef<VakantiesStepHandle, VakantiesStepProps>(
  (props, ref) => {
    const getSituatieLabel = (vakantie: ZorgSituatie) => {
      if (vakantie.startDatum && vakantie.eindDatum) {
        return `${new Date(vakantie.startDatum).toLocaleDateString('nl-NL')} - ${new Date(vakantie.eindDatum).toLocaleDateString('nl-NL')}`
      }
      return ''
    }

    return (
      <ZorgRegelingenStep
        ref={ref}
        {...props}
        zorgCategorieId={6}
        title="Vakantieregelingen"
        situatiesEndpoint="/api/lookups/zorg-situaties?categoryId=6"
        templateType="Vakantie"
        getSituatieLabel={getSituatieLabel}
      />
    )
  }
)