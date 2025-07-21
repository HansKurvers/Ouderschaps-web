import { ApiResponse, RelatieType } from '../types/api.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const relatieTypesService = {
  async getRelatieTypes(): Promise<RelatieType[]> {
    const response = await fetch(`${API_BASE_URL}/api/relatie-types`)

    if (!response.ok) {
      throw new Error('Failed to fetch relatie types')
    }

    const data: ApiResponse<RelatieType[]> = await response.json()
    return data.data || []
  }
}