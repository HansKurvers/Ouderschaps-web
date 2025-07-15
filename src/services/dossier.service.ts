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
    return dossiers.map((d: any) => ({
      ...d,
      naam: `Dossier ${d.dossierNummer || d.dossier_nummer}`,
      dossierId: d.dossierNummer || d.dossier_nummer,
      createdAt: d.aangemaaktOp || d.aangemaakt_op,
      updatedAt: d.gewijzigdOp || d.gewijzigd_op,
      // Keep original fields for compatibility
      dossier_nummer: d.dossierNummer || d.dossier_nummer,
      aangemaakt_op: d.aangemaaktOp || d.aangemaakt_op,
      gewijzigd_op: d.gewijzigdOp || d.gewijzigd_op,
      gebruiker_id: d.gebruikerId || d.gebruiker_id
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