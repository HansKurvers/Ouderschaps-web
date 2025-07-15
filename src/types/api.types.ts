export interface Dossier {
  _id: string
  dossierId: string
  naam: string
  status: string
  gebruikerId: string
  createdAt: string
  updatedAt: string
}

export interface Persoon {
  _id: string
  persoonId: string
  voorletters?: string
  voornamen?: string
  roepnaam?: string
  geslacht?: string
  tussenvoegsel?: string
  achternaam: string
  adres?: string
  postcode?: string
  plaats?: string
  geboorte_plaats?: string
  geboorte_datum?: string
  nationaliteit_1?: string
  nationaliteit_2?: string
  telefoon?: string
  email?: string
  beroep?: string
}

export interface DossierPartij {
  _id: string
  dossierPartijId: string
  dossierId: string
  persoonId: string
  rolId: string
  persoon?: Persoon
  rol?: Rol
}

export interface Rol {
  id: number
  naam: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface Pagination {
  totaal: number
  limiet: number
  offset: number
  heeftMeer: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  paginering: Pagination
}