# Gemstone Guilds App - Agent Documentation

## Project Overview

**Gemstone Guilds** is a web-based multiplayer card game platform built with React, TypeScript, and Vite. The application features multiple card games including Splendor and Dead Man's Draw, with support for both single-player and online multiplayer modes.

### Key Characteristics
- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn-ui (Radix UI components)
- **Styling**: Tailwind CSS
- **State Management**: React hooks and custom context
- **Real-time Communication**: Socket.io
- **Authentication**: Custom authentication system
- **Hosting**: Node.js backend server with express
- **Testing**: Vitest

## Technology Stack

### Dependencies (Core)
- **react** & **react-dom**: UI framework
- **react-router-dom**: Client-side routing
- **@tanstack/react-query**: Server state management
- **socket.io-client**: Real-time multiplayer support
- **zod**: Schema validation
- **react-hook-form**: Form management
- **date-fns**: Date utilities
- **clsx**: Conditional classname utilities

### UI Components (shadcn-ui)
- Comprehensive Radix UI component library including:
  - Dialog, Dropdown, Tabs, Select, Accordion
  - Toast notifications, Tooltips, Popovers
  - Navigation menus, Buttons, Forms

### Dev Dependencies
- **@vitejs/plugin-react-swc**: Fast React refresh with SWC
- **eslint**: Code linting
- **tailwindcss**: Utility-first CSS
- **typescript**: Type safety
- **vitest**: Unit testing framework

## Project Structure

### Root Level Files
- `vite.config.ts` - Vite server configuration (port 8080, HMR setup)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `package.json` - Dependencies and scripts
- `server.js` - Node.js backend server for multiplayer
- `index.html` - HTML entry point
- `eslint.config.js` - Linting rules

### `/src` Directory Structure

#### Core Application
- `main.tsx` - Vite entry point
- `App.tsx` - Main router and provider setup
- `App.css` - Global styles
- `index.css` - Reset and base styles
- `vite-env.d.ts` - Vite environment types

#### `/components` - React Components
**Auth Components** (`/auth`)
- `RequireAuth.tsx` - Route guard for authenticated users
- `AuthLanguageSwitcher.tsx` - Language selection in auth flow

**Game Components** (`/game`)
- `CardDisplay.tsx` - Card rendering component
- `GameBoard.tsx` - Main game board display
- `GameHeader.tsx` - Game title, player info, settings
- `GameOverlays.tsx` - Game modals and popups
- `GemToken.tsx` - Gem token visual component
- `Chat.tsx` - In-game chat interface
- `MusicControl.tsx` - Background music controls
- `LanguageToggle.tsx` - Language switcher during gameplay
- `MenuSettingsDialog.tsx` - Game settings modal
- `AppBottomNav.tsx` - Bottom navigation bar
- `AppPageShell.tsx` - Page layout wrapper

**UI Components** (`/ui`)
- Reusable shadcn-ui components library

**Other Components**
- `LogPanel.tsx` - Game log/transcript display
- `NavLink.tsx` - Navigation link wrapper

#### `/hooks` - Custom React Hooks
- `useAuth.tsx` - Authentication state and methods
- `useGame.ts` - Game state management
- `useLanguage.tsx` - Bilingual language context
- `useAudio.ts` - Audio playback management
- `useBackgroundMusic.ts` - Background music controller
- `useVoiceChat.ts` - Voice chat functionality
- `useOnlineGame.ts` - Online multiplayer state
- `use-toast.ts` - Toast notification hook
- `use-mobile.tsx` - Mobile device detection

#### `/lib` - Game Logic & Utilities
**Core Game Logic**
- `gameLogic.ts` - Main Splendor game rules and mechanics
- `gameCatalog.ts` - Available games catalog
- `gameData.ts` - Game constants and initial state

**Game-Specific Logic**
- `deadMansDraw.ts` - Dead Man's Draw game rules
- `deadMansDrawAI.ts` - AI opponent for Dead Man's Draw
- `aiPlayer.ts` - AI logic for Splendor

**Features & Systems**
- `progression.ts` - Player progression and leveling
- `challenges.ts` - Solo challenge system
- `shop.ts` - In-game shop and cosmetics system
- `cosmetics.ts` - Cosmetic items and visual customization
- `playerExtras.ts` - Player customization options
- `social.ts` - Friend and group features

**Utilities**
- `audioManager.ts` - Audio file management
- `socketConfig.ts` - Socket.io configuration and event handling
- `pageBackgrounds.ts` - Page background images
- `utils.ts` - General utility functions

#### `/pages` - Page Components (Routes)
- `Landing.tsx` - Home page (authentication check)
- `Login.tsx` - Login form
- `SignUp.tsx` - Registration form
- `Index.tsx` - Authenticated home dashboard
- `GamesList.tsx` - Available games listing
- `ModeSetup.tsx` - Game mode selection (solo, online, AI)
- `Game.tsx` - Single-player game page
- `SplendorGame.tsx` - Splendor-specific game view
- `DeadMansDrawGame.tsx` - Dead Man's Draw game view
- `SoloChallenge.tsx` - Challenge mode
- `OnlineLobby.tsx` - Online multiplayer lobby
- `OnlineMatchmaking.tsx` - Player matching system
- `OnlineGame.tsx` - Multiplayer game in progress
- `AccountCenter.tsx` - User profile and settings
- `Shop.tsx` - Cosmetics marketplace
- `Friends.tsx` - Friend management
- `Groups.tsx` - Group/guild management
- `Events.tsx` - Event listing
- `AboutUs.tsx` - Project information
- `Tutorial.tsx` - Game tutorials
- `NotFound.tsx` - 404 error page

#### `/test` - Testing
- `example.test.ts` - Example test suite
- `gameLogic.test.ts` - Game logic unit tests
- `setup.ts` - Vitest configuration

#### `/assets` - Static Assets
- Game card data and images
- Game-related visual assets

### `/public` - Static Files
- `robots.txt` - SEO file

### `/server-data` - Persistent Data
- `shared-state.json` - Multiplayer game state storage

### Configuration Files
- `tailwind.config.ts` - Tailwind theme and plugin config
- `postcss.config.js` - PostCSS processing
- `components.json` - shadcn-ui configuration
- `vitest.config.ts` - Test runner configuration

### Documentation
- `/readme` - Implementation guides and setup documentation
- `/docs` - Project documentation
- `PROGRESSION_AND_RANKS.md` - Progression system details

## Game Features

### Supported Games
1. **Splendor** - Classic card game with gem tokens
2. **Dead Man's Draw** - Competitive card game

### Game Modes
- **Solo**: Single-player against AI
- **Online**: Multiplayer with real players (Socket.io)
- **Challenges**: Special challenge scenarios
- **Tutorial**: Guided game tutorials

### Core Features
- **Authentication**: User registration and login
- **Bilingual Support**: English and Persian language support
- **Progression System**: Levels, ranks, and achievements
- **Cosmetics Shop**: Purchase and equip visual customizations
- **Social Features**: Friends list, groups/guilds, messaging
- **Audio**: Background music and sound effects with controls
- **Real-time Multiplayer**: Socket.io-based game synchronization
- **Chat**: In-game messaging during multiplayer matches
- **Mobile Support**: Responsive design for mobile devices

## Development Workflow

### NPM Scripts
```bash
npm run dev           # Start Vite dev server (port 8080)
npm run dev:client   # Start client dev server only
npm run dev:server   # Start Node.js backend server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Development Environment
- Development server runs on `http://localhost:8080`
- Backend server can run concurrently for multiplayer testing
- Hot Module Replacement (HMR) enabled for instant code updates
- Enable component tagging via lovable-tagger in development

## Key Architecture Patterns

### State Management
- **React Context**: Language, Authentication, Game state
- **React Hooks**: Custom hooks for feature isolation
- **React Query**: Server state and caching
- **Socket.io Events**: Real-time multiplayer state sync

### Component Organization
- Page components handle routing and full-page layout
- Reusable UI components in `/components/ui`
- Feature-specific components in `/components` subdirectories
- Custom hooks extract business logic from components

### Game Loop
- Turn-based game mechanics
- Server-side state validation for online games
- Client-side optimistic updates
- Event-driven architecture with Socket.io

## Common Development Tasks

### Adding a New Page
1. Create component in `/src/pages`
2. Add route to `App.tsx`
3. Implement using `AppPageShell` for consistent layout

### Adding a New UI Component
1. Create reusable component in `/src/components/ui`
2. Based on shadcn-ui or Radix UI primitives
3. Use Tailwind Classes for styling

### Working with Game Logic
1. Modify rules in `/src/lib/gameLogic.ts` or game-specific files
2. Update tests in `/src/test`
3. Run `npm run test` to validate changes

### Implementing Multiplayer Features
1. Update Socket.io events in `socketConfig.ts`
2. Handle events in relevant components via `useOnlineGame` hook
3. Update server-side state in `server.js` if needed
4. Test with multiple connections

### Styling Updates
1. Use Tailwind utility classes
2. Custom CSS in component `.tsx` files using CSS modules
3. Global styles in `index.css` or `App.css`

## Testing

### Running Tests
```bash
npm run test        # Single run
npm run test:watch  # Watch mode for development
```

### Test Files
- `gameLogic.test.ts` - Game mechanics and rules validation
- `example.test.ts` - Testing patterns and examples
- `setup.ts` - Vitest configuration and test utilities

## Deployment Considerations

- Build output goes to dist folder via `npm run build`
- Server.js handles backend for multiplayer (needs hosting)
- Environment variables may be needed for production
- Socket.io events need proper CORS configuration for deployment

## Important Notes

### Bilingual Implementation
- All UI strings managed via language context
- Components use `useLanguage()` hook for translations
- Support for English and Persian
- Language switcher available throughout app

### Performance Optimizations
- Vite for fast build times
- React.lazy for code splitting on routes
- Socket.io for efficient real-time updates
- Tailwind CSS for minimal CSS output

### Browser Support
- Modern browsers supporting ES2020+
- Responsive design for mobile to desktop
- Mobile detection via `use-mobile` hook

## File Naming Conventions

- **Components**: PascalCase (e.g., `GameBoard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGame.ts`)
- **Utilities/Libraries**: camelCase (e.g., `gameLogic.ts`)
- **Pages**: PascalCase (e.g., `SplendorGame.tsx`)
- **Styles**: Tailwind classes inline, or `.css` files alongside components

## Contact & Project Info

- **Project Name**: Gemstone Guilds App
- **Version**: 0.0.0
- **Type**: Module-based ES6
- **License**: Check repository for details

---

*This agent.md file provides a comprehensive overview of the Gemstone Guilds project structure and architecture to assist in understanding and developing the application.*
