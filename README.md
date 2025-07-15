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

## 🐛 Problemen Oplossen

- **Port in gebruik**: Als port 3000 bezet is, wijzigt Vite automatisch naar een andere port
- **Dependencies errors**: Verwijder `node_modules` en run `npm install` opnieuw
- **TypeScript errors**: Run `npm run typecheck` om alle type fouten te zien

## 📚 Meer Leren

- [React Documentatie](https://react.dev)
- [Mantine Documentatie](https://mantine.dev)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [Vite Guide](https://vitejs.dev/guide/)