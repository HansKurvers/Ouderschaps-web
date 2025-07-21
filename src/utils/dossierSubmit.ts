import { dossierService } from '../services/dossier.service'
import { Dossier, Persoon } from '../types/api.types'
import { getPersoonId, getDossierNummer } from './dossierHelpers'

interface PartijData {
  persoon: Persoon | null
  rolId: string
}

interface SubmitDossierParams {
  isEdit: boolean
  dossierId?: string
  dossierNummer: string
  partij1: PartijData
  partij2: PartijData
}

export async function submitDossier({
  isEdit,
  dossierId,
  dossierNummer,
  partij1,
  partij2
}: SubmitDossierParams): Promise<{ success: boolean; message: string; error?: Error }> {
  try {
    let dossier: Dossier
    
    if (isEdit && dossierId) {
      // Update existing dossier
      dossier = await dossierService.getDossier(dossierId)
      
      try {
        // Get and remove existing partijen
        const existingPartijen = await dossierService.getDossierPartijen(dossierId)
        
        for (const partij of existingPartijen) {
          const partijId = partij.dossierPartijId || partij._id || (partij as any).id
          if (partijId) {
            await dossierService.removeDossierPartij(dossierId, partijId)
          }
        }
        
        // Add new partijen
        await addPartijen(dossierId, partij1, partij2)
      } catch (partijErr) {
        console.error('Error updating partijen:', partijErr)
        return {
          success: true,
          message: `Dossier ${getDossierNummer(dossier) || dossierId} bijgewerkt, maar er was een probleem met het bijwerken van partijen`
        }
      }
      
      return {
        success: true,
        message: `Dossier ${getDossierNummer(dossier) || dossierId} is succesvol bijgewerkt`
      }
    } else {
      // Create new dossier
      dossier = await dossierService.createDossier({ dossierNummer })
      const dossierIdToUse = String(dossier.id)
      
      await addPartijen(dossierIdToUse, partij1, partij2)
      
      return {
        success: true,
        message: `Dossier ${getDossierNummer(dossier)} is succesvol aangemaakt`
      }
    }
  } catch (err) {
    console.error('Error submitting dossier:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Er is een fout opgetreden',
      error: err instanceof Error ? err : new Error('Unknown error')
    }
  }
}

async function addPartijen(dossierId: string, partij1: PartijData, partij2: PartijData): Promise<void> {
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
}