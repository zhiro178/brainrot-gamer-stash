# Gaming Marketplace Application

## Overview

This is a full-stack gaming marketplace application called "592 Stock" built with React, Express, TypeScript, and Supabase. It allows users to browse, purchase, and trade virtual gaming items across multiple popular games. The application features a modern gaming-themed design with vibrant colors and gradients.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom gaming-themed design system
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **State Management**: React Context for admin functionality, TanStack Query for server state
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Authentication**: Supabase Auth integration
- **Storage**: In-memory storage class for development, PostgreSQL for production

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Support System**: Tickets and messages for customer support
- **Payment System**: Gift card submissions and crypto top-ups tracking

## Key Components

### Authentication System
- User registration and login through Supabase
- Admin role detection for special users (zhirocomputer@gmail.com, ajay123phone@gmail.com)
- Protected routes and admin-only features

### Gaming Marketplace
- **Game Categories**: Adopt Me, Grow a Garden, MM2, Steal a Brainrot
- **Item Management**: Categorized virtual items with rarity system
- **Admin Panel**: Full CRUD operations for games, categories, and items
- **Real-time Editing**: Admin overlay system for live content management

### Payment Integration
- **Crypto Payments**: Instant processing with minimum $5 requirement
- **Gift Cards**: Amazon gift card submissions with manual verification
- **Balance System**: User wallet functionality

### Support System
- **Live Chat**: AI-powered mascot chat for basic inquiries
- **Ticket System**: Full support ticket management with real-time messaging
- **Admin Dashboard**: Comprehensive support ticket management

## Data Flow

1. **User Authentication**: Supabase handles authentication, frontend manages session state
2. **Game Browsing**: Static game data with dynamic item loading
3. **Purchase Flow**: Balance checks → transaction processing → item delivery
4. **Admin Operations**: Real-time content updates through admin context
5. **Support Tickets**: Supabase real-time subscriptions for instant messaging

## External Dependencies

### Third-Party Services
- **Supabase**: Authentication, real-time database, and support ticket storage
- **Neon Database**: PostgreSQL hosting for production
- **Replit**: Development environment and deployment platform

### Key Libraries
- **UI**: @radix-ui components, lucide-react icons
- **Forms**: react-hook-form with @hookform/resolvers
- **Styling**: tailwindcss, class-variance-authority, clsx
- **Data**: @tanstack/react-query, drizzle-orm
- **Development**: vite, tsx, typescript

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- Express server with tsx for backend hot reloading
- In-memory storage for rapid development

### Production
- Frontend: Vite build output served as static files
- Backend: esbuild bundled Express server
- Database: PostgreSQL with Drizzle migrations
- Environment: Replit hosting with containerized deployment

### Build Process
1. `npm run build`: Vite builds frontend, esbuild bundles backend
2. Static assets served from `/dist/public`
3. API routes prefixed with `/api`
4. Database migrations run via `drizzle-kit push`

## Changelog
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.