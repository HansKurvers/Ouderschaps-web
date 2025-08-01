import { Omgang } from '../types/api.types'

const API_URL = import.meta.env.VITE_API_URL || 'https://ouderschaps-api-fvgbfwachxabawgs.westeurope-01.azurewebsites.net'

class OmgangService {
 
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': '1' // Hardcoded for now, update when auth is implemented
    }
  }
  //TODO update when auth is implemented

  async getOmgangByDossier(dossierId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch omgang data')
    }
    
    return response.json()
  }

  async createOmgang(dossierId: string, data: any): Promise<Omgang> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      // Create omgang error
      throw new Error(`Failed to create omgang: ${errorText}`)
    }
    
    return response.json()
  }

  async updateOmgang(dossierId: string, omgangId: number, data: Partial<Omgang>): Promise<Omgang> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang/${omgangId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update omgang')
    }
    
    return response.json()
  }

  async deleteOmgang(dossierId: string, omgangId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang/${omgangId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete omgang')
    }
  }

  async getDagen(): Promise<any> {
    const response = await fetch(`${API_URL}/api/lookups/dagen`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dagen')
    }
    
    return response.json()
  }

  async getDagdelen(): Promise<any> {
    const response = await fetch(`${API_URL}/api/lookups/dagdelen`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dagdelen')
    }
    
    return response.json()
  }

  async getWeekRegelingen(): Promise<any> {
    const response = await fetch(`${API_URL}/api/lookups/week-regelingen`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch week regelingen')
    }
    
    return response.json()
  }

  async createOmgangBatch(dossierId: string, entries: any[]): Promise<any> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang/batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ entries })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create omgang batch: ${errorText}`)
    }
    
    return response.json()
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
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang/week`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(weekData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upsert week data: ${errorText}`)
    }
    
    return response.json()
  }

  async getWeekData(dossierId: string, weekRegelingId: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/dossiers/${dossierId}/omgang/week/${weekRegelingId}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch week data')
    }
    
    return response.json()
  }
}

export const omgangService = new OmgangService()