# Ouderschaps Web

Een moderne React applicatie gebouwd met Vite, TypeScript, Mantine UI en React Router.

## 🚀 Snel Starten

### Vereisten
- Node.js (versie 16 of hoger)
- npm (komt mee met Node.js)

### Installatie

1. Open een terminal in de project folder
2. Installeer alle benodigde packages:
```bash
npm install
```

### Development Server Starten

Start de applicatie in development mode:
```bash
npm run dev
```

De applicatie opent automatisch in je browser op http://localhost:3000

## 📝 Beschikbare Scripts

In de project directory kun je de volgende commando's uitvoeren:

### `npm run dev`
Start de development server met hot-reload. Wijzigingen in je code worden direct zichtbaar in de browser.

### `npm run build`
Bouwt de applicatie voor productie. De geoptimaliseerde bestanden komen in de `dist` folder.

### `npm run preview`
Bekijk een preview van de productie build lokaal.

### `npm run typecheck`
Controleert of er TypeScript fouten in je code zitten.

## 🏗️ Project Structuur

```
src/
├── components/     # Herbruikbare componenten
├── layouts/        # Layout componenten (header, sidebar, etc.)
├── pages/          # Pagina componenten voor elke route
├── App.tsx         # Hoofdapplicatie met routing en providers
└── main.tsx        # Entry point van de applicatie
```

## 🛠️ Gebruikte Technologieën

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Snelle build tool
- **Mantine UI** - Component library
- **React Router** - Client-side routing
- **Tabler Icons** - Icon library

## 💡 Tips voor Beginners

1. **Live Reload**: Als je wijzigingen maakt in de code, zie je deze direct in de browser
2. **TypeScript Errors**: Als je rode onderstreping ziet in je editor, hover er overheen voor hulp
3. **Component Structuur**: Begin met het aanpassen van de pagina's in `src/pages/`
4. **Styling**: Mantine componenten kunnen gestyled worden met props zoals `color`, `size`, `radius`

## 🎨 Nieuwe Pagina Toevoegen

1. Maak een nieuw bestand in `src/pages/` (bijv. `MyPage.tsx`)
2. Voeg de route toe in `src/App.tsx`:
```tsx
<Route path="my-page" element={<MyPage />} />
```
3. Voeg een link toe in `src/components/Navigation.tsx`

## 🧩 Component Ontwikkeling Guide

### Project Structuur
```
src/
├── components/          # Herbruikbare UI componenten
│   ├── Navigation.tsx   # Hoofdnavigatie component
│   └── PersonenSelectModal.tsx  # Modal voor persoon selectie
├── pages/              # Pagina componenten (React Router routes)
│   ├── DossiersPage.tsx        # Overzicht van dossiers
│   ├── DossierFormPage.tsx     # Dossier aanmaken/bewerken
│   ├── ContactenOverzichtPage.tsx  # Contacten overzicht
│   └── ContactFormPage.tsx     # Contact formulier
├── services/           # API communicatie
│   ├── api.service.ts  # Basis API configuratie
│   ├── dossier.service.ts  # Dossier CRUD operaties
│   └── persoon.service.ts  # Persoon CRUD operaties
├── types/              # TypeScript type definities
│   └── api.types.ts    # API response types
└── layouts/            # Layout componenten
    └── MainLayout.tsx  # Hoofd layout met navigatie
```

### Nieuwe Component Maken

#### 1. Component Structuur
Gebruik deze basis template voor nieuwe componenten:

```tsx
import { useState, useEffect } from 'react'
import { Container, Title, Button, Group, Loader, Alert } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'

// Import je services en types
import { myService } from '../services/my.service'
import { MyType } from '../types/api.types'

export function MyComponent() {
  const navigate = useNavigate()
  const [data, setData] = useState<MyType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await myService.getData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <Container>
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container>
        <Alert title="Fout" color="red" mt="md">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      <Group justify="space-between" mb="xl">
        <Title order={1}>Mijn Component</Title>
        <Button 
          leftSection={<IconPlus size={20} />}
          onClick={() => navigate('/my-path/nieuw')}
        >
          Nieuw Item
        </Button>
      </Group>
      
      {/* Jouw component content hier */}
    </Container>
  )
}
```

#### 2. Partij-achtige Components (Child Components)
Voor features zoals "Partij 1" en "Partij 2" in dossiers:

**Voorbeeld: Nieuwe rol toevoegen (bijv. "Partij 3")**

In `DossierFormPage.tsx`:
```tsx
// Voeg nieuwe state toe
const [partij3, setPartij3] = useState<PartijData>({ persoon: null, rolId: '3' })

// Update validation logic
const canProceed = (step: number) => {
  switch (step) {
    case 1:
      return partij1.persoon !== null && partij2.persoon !== null && partij3.persoon !== null
    // ... rest van logic
  }
}

// Voeg selectie modal toe
<Button
  leftSection={<IconUserPlus size={20} />}
  onClick={() => {
    setSelectingPartij(3) // Nieuwe partij nummer
    setSelectModalOpen(true)
  }}
>
  Selecteer persoon voor Partij 3
</Button>
```

#### 3. Service Pattern
Voor nieuwe entities, maak een service file:

```tsx
// src/services/my-entity.service.ts
import { apiService } from './api.service'
import { MyEntity } from '../types/api.types'

export const myEntityService = {
  async getAll(): Promise<MyEntity[]> {
    return apiService.get('/my-entities')
  },

  async getById(id: string): Promise<MyEntity> {
    return apiService.get(`/my-entities/${id}`)
  },

  async create(data: Partial<MyEntity>): Promise<MyEntity> {
    return apiService.post('/my-entities', data)
  },

  async update(id: string, data: Partial<MyEntity>): Promise<MyEntity> {
    return apiService.put(`/my-entities/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return apiService.delete(`/my-entities/${id}`)
  }
}
```

#### 4. Type Definitions
Voeg nieuwe types toe in `src/types/api.types.ts`:

```tsx
export interface MyEntity {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  // Voeg andere properties toe
}
```

### Styling & UI Guidelines

#### Mantine Components
- Gebruik **Container** voor page wrappers
- Gebruik **Group** voor horizontal layouts
- Gebruik **Stack** voor vertical layouts
- Gebruik **Paper** voor cards met borders
- Gebruik **Button** met icons van `@tabler/icons-react`

#### Consistent Patterns
- **Loading states**: Altijd een centered Loader component
- **Error handling**: Alert component met rode kleur
- **Empty states**: Paper component met gecentreerde tekst
- **Actions**: Buttons met icons in een Group
- **Forms**: Gebruik `@mantine/form` voor validatie

#### Navigation
Om een nieuwe pagina toe te voegen aan de navigatie:
1. Voeg het item toe aan `src/components/Navigation.tsx`
2. Gebruik een passend Tabler icon
3. Voeg de route toe in `src/App.tsx`

### Best Practices

1. **State Management**: Gebruik useState voor lokale state, services voor API calls
2. **Error Handling**: Altijd try-catch blocks rond API calls
3. **Loading States**: Toon loading indicators tijdens API calls
4. **Notifications**: Gebruik `@mantine/notifications` voor feedback
5. **TypeScript**: Gebruik strikte types voor alle data
6. **Naming**: Gebruik Nederlandse labels/teksten, Engelse code
7. **Responsive**: Mantine componenten zijn responsive by default

## 🐛 Problemen Oplossen

- **Port in gebruik**: Als port 3000 bezet is, wijzigt Vite automatisch naar een andere port
- **Dependencies errors**: Verwijder `node_modules` en run `npm install` opnieuw
- **TypeScript errors**: Run `npm run typecheck` om alle type fouten te zien

## 📚 Meer Leren

- [React Documentatie](https://react.dev)
- [Mantine Documentatie](https://mantine.dev)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [Vite Guide](https://vitejs.dev/guide/)