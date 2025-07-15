import { apiService } from './api.service'
import { Persoon, PaginatedResponse } from '../types/api.types'

export const persoonService = {
  // Haal alle personen op
  async getPersonen(params?: {
    limit?: number
    offset?: number
  }): Promise<Persoon[]> {
    // Voor nu halen we alle personen op zonder paginering
    // Later kunnen we dit uitbreiden met een dossier ID parameter
    try {
      const response = await apiService.get<PaginatedResponse<Persoon>>('/api/personen', params)
      return response.data || []
    } catch (error) {
      // Als de API geen lijst endpoint heeft, return lege array
      console.error('Error fetching personen:', error)
      return []
    }
  },

  // Maak een nieuwe persoon aan
  async createPersoon(data: Partial<Persoon>): Promise<Persoon> {
    return apiService.post<Persoon>('/api/personen', data)
  },

  // Haal een specifieke persoon op
  async getPersoon(persoonId: string): Promise<Persoon> {
    return apiService.get<Persoon>(`/api/personen/${persoonId}`)
  },

  // Update een persoon
  async updatePersoon(persoonId: string, data: Partial<Persoon>): Promise<Persoon> {
    return apiService.put<Persoon>(`/api/personen/${persoonId}`, data)
  },

  // Verwijder een persoon
  async deletePersoon(persoonId: string): Promise<void> {
    return apiService.delete<void>(`/api/personen/${persoonId}`)
  },
}