import { apiService } from './api.service'
import { Dossier, DossierPartij, PaginatedResponse } from '../types/api.types'

export const dossierService = {
  // Haal alle dossiers op voor de ingelogde gebruiker
  async getDossiers(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<Dossier[]> {
    // API vereist altijd een status parameter, gebruik 'Nieuw' als default
    const queryParams = {
      status: 'Nieuw',
      ...params
    }
    const response = await apiService.get<PaginatedResponse<Dossier>>('/api/dossiers', queryParams)
    // De API geeft een geneste structuur terug, we extraheren alleen de data array
    return response.data || []
  },

  // Haal een specifiek dossier op
  async getDossier(dossierId: string): Promise<Dossier> {
    return apiService.get<Dossier>(`/api/dossiers/${dossierId}`)
  },

  // Maak een nieuw dossier
  async createDossier(data: Partial<Dossier>): Promise<Dossier> {
    return apiService.post<Dossier>('/api/dossiers', data)
  },

  // Update dossier status
  async updateDossierStatus(dossierId: string, status: string): Promise<Dossier> {
    return apiService.put<Dossier>(`/api/dossiers/${dossierId}`, { status })
  },

  // Verwijder dossier
  async deleteDossier(dossierId: string): Promise<void> {
    return apiService.delete<void>(`/api/dossiers/${dossierId}`)
  },

  // Haal partijen van een dossier op
  async getDossierPartijen(dossierId: string): Promise<DossierPartij[]> {
    return apiService.get<DossierPartij[]>(`/api/dossiers/${dossierId}/partijen`)
  },
}