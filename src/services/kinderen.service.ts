import { apiService } from './api.service'
import { ApiResponse, DossierKind, AddKindData } from '../types/api.types'

export const kinderenService = {
  async getDossierKinderen(dossierId: string): Promise<DossierKind[]> {
    try {
      const result = await apiService.get<any>(`/api/dossiers/${dossierId}/kinderen`)
      // Handle both possible response formats
      if (result.success && result.data) {
        return result.data
      } else if (Array.isArray(result)) {
        return result
      }
      return []
    } catch (error) {
      console.error('Failed to fetch kinderen:', error)
      throw new Error('Failed to fetch kinderen')
    }
  },

  async addKindToDossier(dossierId: string, data: AddKindData): Promise<DossierKind> {
    // Transform data to match API expectations
    const requestBody = {
      kindId: data.kindId,
      kindData: data.kindData,
      ouderRelaties: data.ouderRelaties || []
    }
    
    try {
      const result = await apiService.post<any>(
        `/api/dossiers/${dossierId}/kinderen`,
        requestBody
      )
      // Handle both possible response formats
      if (result.data) {
        return result.data
      } else if (result.dossierKindId || result.id) {
        return result
      }
      throw new Error('No data returned')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add kind to dossier')
    }
  },

  async removeKindFromDossier(dossierId: string, dossierKindId: string): Promise<void> {
    try {
      await apiService.delete(`/api/dossiers/${dossierId}/kinderen/${dossierKindId}`)
    } catch (error) {
      console.error('Failed to remove kind from dossier:', error)
      throw new Error('Failed to remove kind from dossier')
    }
  }
}