import { apiService } from './api.service'
import { Dossier, DossierPartij, PaginatedResponse } from '../types/api.types'

export const dossierService = {
  // Haal alle dossiers op voor de ingelogde gebruiker
  async getDossiers(params?: {
    includeInactive?: boolean
    onlyInactive?: boolean
    limit?: number
    offset?: number
  }): Promise<Dossier[]> {
    // Default: alleen actieve dossiers (status = false)
    const queryParams = {
      includeInactive: params?.includeInactive || false,
      onlyInactive: params?.onlyInactive || false,
      limit: params?.limit || 20,
      offset: params?.offset || 0
    }
    const response = await apiService.get<PaginatedResponse<Dossier>>('/api/dossiers', queryParams)
    
    // Map de database velden naar frontend velden
    const dossiers = response.data || []
    return dossiers.map(d => ({
      ...d,
      naam: `Dossier ${d.dossier_nummer}`,
      dossierId: d.dossier_nummer,
      createdAt: d.aangemaakt_op,
      updatedAt: d.gewijzigd_op
    }))
  },

  // Haal een specifiek dossier op
  async getDossier(dossierId: string): Promise<Dossier> {
    return apiService.get<Dossier>(`/api/dossiers/${dossierId}`)
  },

  // Maak een nieuw dossier
  async createDossier(data: Partial<Dossier>): Promise<Dossier> {
    return apiService.post<Dossier>('/api/dossiers', data)
  },

  // Update dossier
  async updateDossier(dossierId: string, data: Partial<Dossier>): Promise<Dossier> {
    return apiService.put<Dossier>(`/api/dossiers/${dossierId}`, data)
  },

  // Verwijder dossier
  async deleteDossier(dossierId: string): Promise<void> {
    return apiService.delete<void>(`/api/dossiers/${dossierId}`)
  },

  // Haal partijen van een dossier op
  async getDossierPartijen(dossierId: string): Promise<DossierPartij[]> {
    return apiService.get<DossierPartij[]>(`/api/dossiers/${dossierId}/partijen`)
  },

  // Voeg een partij toe aan een dossier
  async addDossierPartij(dossierId: string, data: { persoonId: string; rolId: string }): Promise<DossierPartij> {
    return apiService.post<DossierPartij>(`/api/dossiers/${dossierId}/partijen`, data)
  },

  // Verwijder een partij uit een dossier
  async removeDossierPartij(dossierId: string, partijId: string): Promise<void> {
    return apiService.delete<void>(`/api/dossiers/${dossierId}/partijen/${partijId}`)
  },
}