import { useState, useEffect, useCallback } from 'react'
import { DossierKind, AddKindData } from '../types/api.types'
import { kinderenService } from '../services/kinderen.service'
import { notifications } from '@mantine/notifications'

export function useDossierKinderen(dossierId?: string) {
  const [kinderen, setKinderen] = useState<DossierKind[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadKinderen = useCallback(async () => {
    if (!dossierId) return

    try {
      setLoading(true)
      setError(null)
      const data = await kinderenService.getDossierKinderen(dossierId)
      setKinderen(data)
    } catch (err) {
      setError('Kon kinderen niet laden')
      notifications.show({
        title: 'Fout',
        message: 'Kon kinderen niet laden',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }, [dossierId])

  useEffect(() => {
    if (dossierId) {
      loadKinderen()
    }
  }, [dossierId, loadKinderen])

  const addKind = async (data: AddKindData) => {
    if (!dossierId) return

    try {
      setLoading(true)
      const newKind = await kinderenService.addKindToDossier(dossierId, data)
      setKinderen(prev => [...prev, newKind])
      notifications.show({
        title: 'Succes',
        message: 'Kind toegevoegd aan dossier',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon kind niet toevoegen',
        color: 'red'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeKind = async (dossierKindId: string) => {
    if (!dossierId) return

    try {
      setLoading(true)
      await kinderenService.removeKindFromDossier(dossierId, dossierKindId)
      setKinderen(prev => prev.filter(k => String(k.id) !== dossierKindId))
      notifications.show({
        title: 'Succes',
        message: 'Kind verwijderd uit dossier',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Fout',
        message: 'Kon kind niet verwijderen',
        color: 'red'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getKindIds = () => {
    return kinderen.map(k => k.kind.id)
  }

  return {
    kinderen,
    loading,
    error,
    addKind,
    removeKind,
    getKindIds,
    reload: loadKinderen
  }
}