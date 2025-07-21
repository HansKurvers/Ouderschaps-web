import { dossierService } from '../services/dossier.service'
import { Dossier, DossierPartij } from '../types/api.types'

export interface DossierLoadResult {
  dossier: Dossier | null
  partijen: DossierPartij[]
  error?: Error
}

export async function loadDossierData(dossierId: string): Promise<DossierLoadResult> {
  try {
    const dossier = await dossierService.getDossier(dossierId)
    
    try {
      const partijen = await dossierService.getDossierPartijen(dossierId)
      return { dossier, partijen }
    } catch (partijErr) {
      // If partijen loading fails, still return the dossier
      console.error('Error loading partijen:', partijErr)
      return { dossier, partijen: [] }
    }
  } catch (err) {
    console.error('Error loading dossier:', err)
    return { 
      dossier: null, 
      partijen: [], 
      error: err instanceof Error ? err : new Error('Failed to load dossier') 
    }
  }
}

export function getPersoonId(persoon: any): string | null {
  return persoon?.persoonId || (persoon?.id ? String(persoon.id) : null)
}

export function getDossierNummer(dossier: Dossier): string {
  return dossier.dossierNummer || dossier.dossier_nummer || ''
}