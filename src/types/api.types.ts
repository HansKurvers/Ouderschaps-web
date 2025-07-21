export interface Dossier {
  id: number
  // Both snake_case and camelCase versions for API compatibility
  dossier_nummer?: string
  dossierNummer?: string
  aangemaakt_op?: string
  aangemaaktOp?: string
  gewijzigd_op?: string
  gewijzigdOp?: string
  gebruiker_id?: number
  gebruikerId?: number
  status?: boolean
  // Frontend display fields
  naam?: string
  dossierId?: string
  createdAt?: string
  updatedAt?: string
}

export interface Persoon {
  _id: string
  persoonId: string
  id?: number | string  // Some responses use id instead of persoonId
  voorletters?: string
  voornamen?: string
  roepnaam?: string
  geslacht?: string
  tussenvoegsel?: string
  achternaam: string
  adres?: string
  postcode?: string
  plaats?: string
  geboortePlaats?: string
  geboorteDatum?: string
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

export interface RelatieType {
  id: number
  naam: string
}

export interface OuderRelatie {
  ouderId: string
  relatieTypeId: string
  relatieType?: RelatieType
  ouder?: Persoon
}

export interface DossierKind {
  id: number  // Dit is het dossiers_kinderen.id
  kind: Persoon
  ouders: Array<{
    ouder: Persoon
    relatieType: RelatieType
  }>
}

export interface AddKindData {
  kindId?: string
  kindData?: Partial<Persoon>
  ouderRelaties: OuderRelatie[]
}