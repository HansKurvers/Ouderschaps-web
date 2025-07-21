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
  geboortedatum?: string | Date | null
  geslacht?: string
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
  
  postcode: (value: string | undefined) => {
    if (!value) return null // Postcode is optioneel
    
    // Nederlandse postcode: 4 cijfers + 2 letters
    const postcodeRegex = /^\d{4}\s?[A-Za-z]{2}$/
    if (!postcodeRegex.test(value.trim())) {
      return 'Ongeldige postcode (bijv. 1234 AB)'
    }
    return null
  },
  
  rolId: (value: string | undefined, isRequired: boolean = false) => {
    if (isRequired && !value) {
      return 'Selecteer een rol'
    }
    return null
  },
  
  geboortedatum: (value: string | Date | null | undefined) => {
    if (!value) return null // Geboortedatum is optioneel
    
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) {
      return 'Ongeldige datum'
    }
    
    // Check of de datum niet in de toekomst ligt
    if (date > new Date()) {
      return 'Geboortedatum kan niet in de toekomst liggen'
    }
    
    return null
  },
  
  geslacht: (value: string | undefined) => {
    if (!value) return null // Geslacht is optioneel
    
    const validGeslachten = ['Man', 'Vrouw', 'Anders']
    if (!validGeslachten.includes(value)) {
      return 'Selecteer een geldig geslacht'
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
    postcode: contactFormValidation.postcode,
    geboortedatum: contactFormValidation.geboortedatum,
    geslacht: contactFormValidation.geslacht,
    ...(requireRole && {
      rolId: (value: string | undefined) => contactFormValidation.rolId(value, true)
    })
  }
}

// Transform functie voor postcode (automatisch hoofdletters)
export function transformPostcode(value: string): string {
  return value.toUpperCase()
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
  rolId: '',
  adres: '',
  postcode: '',
  plaats: '',
  geboortedatum: null,
  geslacht: ''
}