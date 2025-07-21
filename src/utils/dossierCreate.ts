import { dossierService } from '../services/dossier.service'
import { Dossier, Persoon } from '../types/api.types'
import { getPersoonId, getDossierNummer } from './dossierHelpers'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

interface CreateDossierParams {
  dossierNummer: string
  partij1: PartijData
  partij2: PartijData
}

export async function createDossierWithPartijen({
  dossierNummer,
  partij1,
  partij2
}: CreateDossierParams): Promise<{ success: boolean; dossierId?: string; message: string; error?: Error }> {
  try {
    // Create new dossier
    const dossier = await dossierService.createDossier({ dossierNummer })
    const dossierId = String(dossier.id)
    
    // Add partijen
    if (partij1.persoon) {
      const persoonId = getPersoonId(partij1.persoon)
      if (!persoonId) {
        throw new Error('Persoon ID is required for partij 1')
      }
      
      await dossierService.addDossierPartij(dossierId, {
        persoonId,
        rolId: parseInt(partij1.rolId || '1')
      })
    }
    
    if (partij2.persoon) {
      const persoonId = getPersoonId(partij2.persoon)
      if (!persoonId) {
        throw new Error('Persoon ID is required for partij 2')
      }
      
      await dossierService.addDossierPartij(dossierId, {
        persoonId,
        rolId: parseInt(partij2.rolId || '2')
      })
    }
    
    return {
      success: true,
      dossierId,
      message: `Dossier ${getDossierNummer(dossier)} is succesvol aangemaakt`
    }
  } catch (err) {
    console.error('Error creating dossier:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Er is een fout opgetreden',
      error: err instanceof Error ? err : new Error('Unknown error')
    }
  }
}