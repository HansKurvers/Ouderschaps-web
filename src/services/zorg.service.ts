import { apiService } from './api.service'

export interface ZorgRegeling {
  id?: string
  zorgCategorieId: number
  zorgSituatieId: number
  situatieAnders?: string
  overeenkomst: string
}

export interface ZorgRegelingResponse {
  id: string
  dossierId?: string
  zorgCategorieId?: number
  zorgSituatieId?: number
  zorgCategorie?: {
    id: number
    naam: string
  }
  zorgSituatie?: {
    id: number
    naam: string
    zorgCategorieId: number
  }
  situatieAnders?: string
  overeenkomst: string
  aangemaaktOp?: string
  gewijzigdOp?: string
  aangemaaktDoor?: number
  gewijzigdDoor?: number | null
}

class ZorgService {
  async getZorgRegelingen(dossierId: string, zorgCategorieId?: number): Promise<ZorgRegelingResponse[]> {
    const params = zorgCategorieId ? { zorgCategorieId } : undefined
    return apiService.get<ZorgRegelingResponse[]>(`/api/dossiers/${dossierId}/zorg`, params)
  }

  async createZorgRegeling(dossierId: string, data: ZorgRegeling): Promise<ZorgRegelingResponse> {
    return apiService.post<ZorgRegelingResponse>(`/api/dossiers/${dossierId}/zorg`, data)
  }

  async updateZorgRegeling(dossierId: string, zorgId: string, data: Partial<ZorgRegeling>): Promise<ZorgRegelingResponse> {
    return apiService.put<ZorgRegelingResponse>(`/api/dossiers/${dossierId}/zorg/${zorgId}`, data)
  }

  async deleteZorgRegeling(dossierId: string, zorgId: string): Promise<void> {
    return apiService.delete(`/api/dossiers/${dossierId}/zorg/${zorgId}`)
  }

  async saveOrUpdateZorgRegeling(dossierId: string, data: ZorgRegeling): Promise<ZorgRegelingResponse> {
    if (data.id) {
      const { id, ...updateData } = data
      return this.updateZorgRegeling(dossierId, id, updateData)
    } else {
      return this.createZorgRegeling(dossierId, data)
    }
  }
}

export const zorgService = new ZorgService()