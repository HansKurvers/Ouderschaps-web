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
    const dossier = await apiService.get<any>(`/api/dossiers/${dossierId}`)
    // Map de velden voor consistentie
    return {
      ...dossier,
      dossierId: dossier.dossierId || dossier.dossierNummer || dossier.dossier_nummer,
      createdAt: dossier.createdAt || dossier.aangemaaktOp || dossier.aangemaakt_op,
      updatedAt: dossier.updatedAt || dossier.gewijzigdOp || dossier.gewijzigd_op,
    }
  },

  // Maak een nieuw dossier
  async createDossier(data: Partial<Dossier>): Promise<Dossier> {
    const dossier = await apiService.post<any>('/api/dossiers', data)
    // Map de velden voor consistentie
    return {
      ...dossier,
      dossierId: dossier.dossierId || dossier.dossierNummer || dossier.dossier_nummer,
      createdAt: dossier.createdAt || dossier.aangemaaktOp || dossier.aangemaakt_op,
      updatedAt: dossier.updatedAt || dossier.gewijzigdOp || dossier.gewijzigd_op,
    }
  },

  // Update dossier
  async updateDossier(dossierId: string, data: Partial<Dossier>): Promise<Dossier> {
    const dossier = await apiService.put<any>(`/api/dossiers/${dossierId}`, data)
    // Map de velden voor consistentie
    return {
      ...dossier,
      dossierId: dossier.dossierId || dossier.dossierNummer || dossier.dossier_nummer,
      createdAt: dossier.createdAt || dossier.aangemaaktOp || dossier.aangemaakt_op,
      updatedAt: dossier.updatedAt || dossier.gewijzigdOp || dossier.gewijzigd_op,
    }
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
  async addDossierPartij(dossierId: string, data: { persoonId: string; rolId: number }): Promise<DossierPartij> {
    console.log('Adding partij to dossier:', dossierId, 'with data:', data)
    return apiService.post<DossierPartij>(`/api/dossiers/${dossierId}/partijen`, data)
  },

  // Verwijder een partij uit een dossier
  async removeDossierPartij(dossierId: string, partijId: string): Promise<void> {
    return apiService.delete<void>(`/api/dossiers/${dossierId}/partijen/${partijId}`)
  },

  // Helper functie om display naam te genereren
  async getDossierDisplayNaam(dossierId: string): Promise<string> {
    try {
      const partijen = await this.getDossierPartijen(dossierId)
      if (!partijen || partijen.length === 0) {
        return `Dossier ${dossierId}`
      }

      const partij1 = partijen.find(p => p.rol?.naam === 'Partij 1' || p.rolId === '1')
      const partij2 = partijen.find(p => p.rol?.naam === 'Partij 2' || p.rolId === '2')

      const getVolledigeNaam = (persoon: any) => {
        if (!persoon) return 'Onbekend'
        const delen = [
          persoon.roepnaam || persoon.voornamen,
          persoon.tussenvoegsel,
          persoon.achternaam
        ].filter(Boolean)
        return delen.join(' ')
      }

      const naam1 = partij1?.persoon ? getVolledigeNaam(partij1.persoon) : 'Partij 1'
      const naam2 = partij2?.persoon ? getVolledigeNaam(partij2.persoon) : 'Partij 2'

      return `${naam1} & ${naam2}`
    } catch (err) {
      console.error('Error getting dossier display naam:', err)
      return `Dossier ${dossierId}`
    }
  },
}