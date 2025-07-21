import { useState } from 'react'
import { Persoon } from '../types/api.types'
import { getVolledigeNaam } from '../utils/persoon.utils'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

export function useDossierPartijen() {
  const [partij1, setPartij1] = useState<PartijData>({ persoon: null, rolId: '1' })
  const [partij2, setPartij2] = useState<PartijData>({ persoon: null, rolId: '2' })

  const setPartijPersoon = (partijNumber: 1 | 2, persoon: Persoon) => {
    if (partijNumber === 1) {
      setPartij1(prev => ({ ...prev, persoon }))
    } else {
      setPartij2(prev => ({ ...prev, persoon }))
    }
  }


  const getExcludeIds = () => {
    return [partij1.persoon?.persoonId, partij2.persoon?.persoonId].filter(Boolean) as string[]
  }

  return {
    partij1,
    partij2,
    setPartij1,
    setPartij2,
    setPartijPersoon,
    getVolledigeNaam,
    getExcludeIds
  }
}