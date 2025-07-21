export interface ContactFormValues {
  roepnaam?: string
  voornamen: string
  tussenvoegsel?: string
  achternaam: string
  email?: string
  telefoon?: string
  opmerking?: string
  rolId?: string
  adres?: string
  postcode?: string
  plaats?: string
}

export const contactFormValidation = {
  voornamen: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Voornamen is verplicht'
    }
    if (value.trim().length < 2) {
      return 'Voornamen moet minimaal 2 karakters bevatten'
    }
    return null
  },
  
  achternaam: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Achternaam is verplicht'
    }
    if (value.trim().length < 2) {
      return 'Achternaam moet minimaal 2 karakters bevatten'
    }
    return null
  },
  
  email: (value: string | undefined) => {
    if (!value) return null // Email is optioneel
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Ongeldig e-mailadres'
    }
    return null
  },
  
  telefoon: (value: string | undefined) => {
    if (!value) return null // Telefoon is optioneel
    
    // Nederlandse telefoonnummer validatie (kan aangepast worden)
    const phoneRegex = /^(\+31|0)[\s-]?\d{1,3}[\s-]?\d{6,8}$/
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Ongeldig telefoonnummer'
    }
    return null
  },
  
  rolId: (value: string | undefined, isRequired: boolean = false) => {
    if (isRequired && !value) {
      return 'Selecteer een rol'
    }
    return null
  }
}

// Helper functie om validatie regels te krijgen voor een specifiek formulier
export function getContactFormValidation(requireRole: boolean = false) {
  return {
    voornamen: contactFormValidation.voornamen,
    achternaam: contactFormValidation.achternaam,
    email: contactFormValidation.email,
    telefoon: contactFormValidation.telefoon,
    ...(requireRole && {
      rolId: (value: string | undefined) => contactFormValidation.rolId(value, true)
    })
  }
}

// Initial values voor nieuwe contact formulieren
export const contactFormInitialValues: ContactFormValues = {
  roepnaam: '',
  voornamen: '',
  tussenvoegsel: '',
  achternaam: '',
  email: '',
  telefoon: '',
  opmerking: '',
  rolId: ''
}