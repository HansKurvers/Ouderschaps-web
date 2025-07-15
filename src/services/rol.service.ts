import { apiService } from './api.service'
import { Rol } from '../types/api.types'

export const rolService = {
  // Haal alle beschikbare rollen op
  async getRollen(): Promise<Rol[]> {
    return apiService.get<Rol[]>('/api/rollen')
  },
}