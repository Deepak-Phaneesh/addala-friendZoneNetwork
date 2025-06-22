# FriendZone - Social Media Application

## Overview

FriendZone is a full-stack social media application built for connecting friends and building communities. It's designed as a non-romantic social platform where users can share posts, join interest-based groups, send friend requests, and engage with content through likes and comments.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API endpoints

### Database Schema
The application uses the following core entities:
- **Users**: Profile information, authentication data
- **Posts**: User-generated content with likes and comments
- **Friends**: Friend relationships and requests
- **Groups**: Interest-based communities with membership
- **Notifications**: System notifications for user interactions
- **Sessions**: Authentication session storage

## Key Components

### Authentication System
- Integrated with Replit's OpenID Connect authentication
- Session-based authentication with PostgreSQL session storage
- Middleware for protecting authenticated routes
- Automatic redirect handling for unauthorized users

### Social Features
- **Posts**: Create, view, like, and comment on posts
- **Friends**: Send/accept/decline friend requests, view friend lists
- **Groups**: Create and join interest-based groups
- **Feed**: Personalized content feed based on friends and groups
- **Search**: User search functionality
- **Notifications**: Real-time notification system

### UI/UX Design
- Responsive design optimized for mobile and desktop
- Custom color scheme with brand colors (blue, green, orange)
- Accessible components using Radix UI primitives
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Content Creation**: Posts are created and stored with user associations
3. **Social Interactions**: Friend requests, likes, and comments update related entities
4. **Feed Generation**: Content is aggregated based on user relationships
5. **Real-time Updates**: React Query handles cache invalidation and refetching

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **UI Components**: Radix UI component library
- **Styling**: Tailwind CSS framework
- **Date Handling**: date-fns for date formatting
- **Icons**: Lucide React icon library

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production bundle optimization
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development Environment
- Runs on Replit with hot module replacement
- PostgreSQL module integrated for database provisioning
- Environment variables for database connection and auth configuration

### Production Build
- Vite builds the client-side application
- ESBuild bundles the server application
- Static assets served from Express server
- Database migrations handled via Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL

## Changelog

```
Changelog:
- June 22, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```