import { apiService } from './api.service'
import { Omgang } from '../types/api.types'

class OmgangService {
  async getOmgangByDossier(dossierId: string): Promise<any> {
    try {
      return await apiService.get(`/api/dossiers/${dossierId}/omgang`)
    } catch (error) {
      console.error('Failed to fetch omgang data:', error)
      throw new Error('Failed to fetch omgang data')
    }
  }

  async createOmgang(dossierId: string, data: any): Promise<Omgang> {
    try {
      return await apiService.post(`/api/dossiers/${dossierId}/omgang`, data)
    } catch (error: any) {
      console.error('Failed to create omgang:', error)
      throw new Error(`Failed to create omgang: ${error.message}`)
    }
  }

  async updateOmgang(dossierId: string, omgangId: number, data: Partial<Omgang>): Promise<Omgang> {
    try {
      return await apiService.put(`/api/dossiers/${dossierId}/omgang/${omgangId}`, data)
    } catch (error) {
      console.error('Failed to update omgang:', error)
      throw new Error('Failed to update omgang')
    }
  }

  async deleteOmgang(dossierId: string, omgangId: number): Promise<void> {
    try {
      await apiService.delete(`/api/dossiers/${dossierId}/omgang/${omgangId}`)
    } catch (error) {
      console.error('Failed to delete omgang:', error)
      throw new Error('Failed to delete omgang')
    }
  }

  async getDagen(): Promise<any> {
    try {
      return await apiService.get('/api/lookups/dagen')
    } catch (error) {
      console.error('Failed to fetch dagen:', error)
      throw new Error('Failed to fetch dagen')
    }
  }

  async getDagdelen(): Promise<any> {
    try {
      return await apiService.get('/api/lookups/dagdelen')
    } catch (error) {
      console.error('Failed to fetch dagdelen:', error)
      throw new Error('Failed to fetch dagdelen')
    }
  }

  async getWeekRegelingen(): Promise<any> {
    try {
      return await apiService.get('/api/lookups/week-regelingen')
    } catch (error) {
      console.error('Failed to fetch week regelingen:', error)
      throw new Error('Failed to fetch week regelingen')
    }
  }

  async createOmgangBatch(dossierId: string, entries: any[]): Promise<any> {
    try {
      return await apiService.post(`/api/dossiers/${dossierId}/omgang/batch`, { entries })
    } catch (error: any) {
      console.error('Failed to create omgang batch:', error)
      throw new Error(`Failed to create omgang batch: ${error.message}`)
    }
  }

  async upsertWeekData(dossierId: string, weekData: {
    weekRegelingId: number,
    weekRegelingAnders: string,
    days: Array<{
      dagId: number,
      wisselTijd: string,
      dagdelen: Array<{
        dagdeelId: number,
        verzorgerId: number
      }>
    }>
  }): Promise<any> {
    try {
      return await apiService.post(`/api/dossiers/${dossierId}/omgang/week`, weekData)
    } catch (error: any) {
      console.error('Failed to upsert week data:', error)
      throw new Error(`Failed to upsert week data: ${error.message}`)
    }
  }

  async getWeekData(dossierId: string, weekRegelingId: number): Promise<any> {
    try {
      return await apiService.get(`/api/dossiers/${dossierId}/omgang/week/${weekRegelingId}`)
    } catch (error) {
      console.error('Failed to fetch week data:', error)
      throw new Error('Failed to fetch week data')
    }
  }
}

export const omgangService = new OmgangService()