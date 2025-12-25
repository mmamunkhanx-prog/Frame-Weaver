# NeonFrame - Farcaster Mini App

## Overview

NeonFrame is a Farcaster Mini App (Frame) that allows users to check their Neynar Quotient Score and mint NFTs based on their social scores. The application integrates with the Farcaster social protocol, Neynar API for user scoring, and supports blockchain interactions on Base network for NFT minting and DEGEN token claims.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom cyberpunk/neon theme
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with custom plugins for meta image handling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints under `/api/*`
- **Build Process**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts`
- **Tables**:
  - `users`: Stores Farcaster user data (fid, username, displayName, pfp, walletAddress)
  - `nfts`: Tracks minted NFTs with scores and transaction hashes
  - `degenClaims`: Records DEGEN token claim history

### Authentication & Authorization
- No traditional auth system - relies on Farcaster Frame SDK context
- User identification via Farcaster FID (Farcaster ID)
- Frame verification through Farcaster's domain manifest at `/.well-known/farcaster.json`

### Key Design Patterns
- **Shared Schema**: Database schema defined in `shared/` directory for type sharing between client and server
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **Service Classes**: Dedicated service classes for blockchain operations (`DegenService`, `NftService`)
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for static assets

## External Dependencies

### Farcaster Integration
- **@farcaster/frame-sdk**: SDK for Farcaster Frame interactions
- Provides user context (FID, username) within Farcaster clients like Warpcast
- Domain verification via farcaster.json manifest

### Neynar API
- External API for fetching Farcaster user scores
- Endpoints called from server-side to get Neynar Score and Quotient Score
- Requires NEYNAR_API_KEY environment variable

### Blockchain (Base Network)
- **viem**: Ethereum library for wallet operations
- **@zoralabs/protocol-sdk**: Zora protocol integration for NFT minting
- DEGEN token transfers (ERC20) on Base network
- Requires ADMIN_WALLET_PRIVATE_KEY for server-side transactions

### Database
- PostgreSQL database
- Connection via DATABASE_URL environment variable
- Drizzle Kit for migrations (`drizzle-kit push`)

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NEYNAR_API_KEY`: Neynar API authentication
- `ADMIN_WALLET_PRIVATE_KEY`: Private key for blockchain transactions (optional, enables NFT minting and DEGEN claims)