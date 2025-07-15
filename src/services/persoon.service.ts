import { apiService } from './api.service'
import { Persoon } from '../types/api.types'

export const persoonService = {
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