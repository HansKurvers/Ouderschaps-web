import { ApiResponse, DossierKind, AddKindData } from '../types/api.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const kinderenService = {
  async getDossierKinderen(dossierId: string): Promise<DossierKind[]> {
    const response = await fetch(`${API_BASE_URL}/api/dossiers/${dossierId}/kinderen`, {
      headers: {
        'x-user-id': '1'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch kinderen')
    }

    const result = await response.json()
    // Handle both possible response formats
    if (result.success && result.data) {
      return result.data
    } else if (Array.isArray(result)) {
      return result
    }
    return []
  },

  async addKindToDossier(dossierId: string, data: AddKindData): Promise<DossierKind> {
    // Transform data to match API expectations
    const requestBody = {
      kindId: data.kindId,
      kindData: data.kindData,
      ouderRelaties: data.ouderRelaties || []
    }
    
    const response = await fetch(`${API_BASE_URL}/api/dossiers/${dossierId}/kinderen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add kind to dossier')
    }

    const result: ApiResponse<DossierKind> = await response.json()
    if (!result.data) {
      throw new Error('No data returned')
    }
    return result.data
  },

  async removeKindFromDossier(dossierId: string, dossierKindId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/dossiers/${dossierId}/kinderen/${dossierKindId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': '1'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to remove kind from dossier')
    }
  }
}