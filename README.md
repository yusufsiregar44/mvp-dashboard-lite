# MVP Dashboard Lite - Team & User Hierarchy Management

A full-stack application for managing team hierarchies, user relationships, and resource access control with automatic inheritance mechanisms.

## 🚀 Features

### Core Functionality
- **Team Management**: Create and manage teams with member assignments
- **User Hierarchy**: Multi-level manager relationships (unlimited managers per user)
- **Resource Access Control**: Automatic inheritance of team resources to managers
- **Client Management**: Organize clients and their associated teams
- **Real-time Updates**: Live data synchronization across the application

### Key Business Logic
- **Team Membership Inheritance**: When a user joins a team, their managers automatically inherit team access
- **Resource Assignment**: When a resource is assigned to a team, all team members (including managers) can access it
- **Multi-level Hierarchy**: Support for 2-3 hierarchy levels deep
- **Automatic Access Control**: Combined inheritance ensures managers can access all resources in their subordinates' teams

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, React Context for app state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schema validation
- **API**: RESTful API with comprehensive error handling
- **Middleware**: Custom business rules and validation middleware

### Database Schema
- **Users**: Core user information and authentication
- **User Managers**: Many-to-many relationship for hierarchy management
- **Teams**: Team definitions and metadata
- **Team Members**: User-team associations
- **Team Resources**: Resource assignments to teams
- **Clients**: Client management and organization

## 🛠️ Tech Stack

### Frontend
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Tailwind CSS 3.4.17
- shadcn/ui components
- React Query (TanStack Query) 5.83.0
- React Hook Form 7.61.1
- Zod 3.25.76

### Backend
- Node.js
- Express.js 4.19.2
- TypeScript 5.8.3
- PostgreSQL
- Drizzle ORM 0.44.6
- Zod 3.25.76
- CORS 2.8.5

### Development Tools
- ESLint 9.32.0
- Concurrently 9.1.2
- tsx 4.19.2 (TypeScript execution)
- Drizzle Kit 0.30.0 (Database migrations)

## 📦 Project Structure

```
mvp-dashboard-lite/
├── apps/
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/        # API route handlers
│       │   ├── middleware/    # Validation & business rules
│       │   ├── services/       # Business logic services
│       │   └── schema.ts      # Database schema
│       ├── drizzle/           # Database migrations
│       └── package.json
├── src/                        # Frontend application
│   ├── components/            # React components
│   │   ├── forms/            # Form components
│   │   └── ui/               # shadcn/ui components
│   ├── pages/                 # Page components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and API client
│   └── types/                 # TypeScript type definitions
├── docs/                      # Project documentation
└── package.json               # Root package configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:yusufsiregar44/mvp-dashboard-lite.git
   cd mvp-dashboard-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb mvp_dashboard_lite
   
   # Run database migrations
   cd apps/api
   npm run drizzle:migrate
   
   # Seed the database with initial data
   npm run db:seed
   ```

4. **Configure environment variables**
   Create a `.env` file in `apps/api/` with:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/mvp_dashboard_lite
   PORT=3001
   ```

5. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```
   
   This will start both:
   - Frontend development server (http://localhost:5173)
   - Backend API server (http://localhost:3001)

## 🔧 Development

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:fe` - Start only the frontend development server
- `npm run dev:be` - Start only the backend development server
- `npm run build` - Build the frontend for production
- `npm run lint` - Run ESLint on the codebase

#### Backend API (`apps/api/`)
- `npm run dev` - Start the API server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run start` - Start the production server
- `npm run drizzle:gen` - Generate database migrations
- `npm run drizzle:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with test data

### Database Management

The project uses Drizzle ORM for database management:

```bash
# Generate a new migration
cd apps/api
npm run drizzle:gen

# Apply migrations
npm run drizzle:migrate

# Reset and seed database
npm run db:seed
```

### API Endpoints

The API provides RESTful endpoints for:

- **Users**: `/api/users` - User CRUD operations
- **Teams**: `/api/teams` - Team management
- **Team Members**: `/api/team-members` - Team membership management
- **Team Resources**: `/api/team-resources` - Resource assignments
- **User Managers**: `/api/user-managers` - Hierarchy management
- **Clients**: `/api/clients` - Client management

## 🧪 Testing

The project includes test files for validating business logic:

- `test-action4-multi-level.js` - Multi-level hierarchy testing
- `test-multi-level-manager.js` - Manager relationship testing
- `test-remove-manager.js` - Edge case testing for manager removal

Run tests with:
```bash
node test-action4-multi-level.js
node test-multi-level-manager.js
```

## 📚 Documentation

- [Team Management PRD](./docs/Team%20Management%20and%20User%20Hierarchy%20PRD.md) - Complete product requirements
- [Key Actions](./docs/Key%20Actions%2027f92878a9d280d49c30c194f0fe72c4.md) - Implementation details
- [Key Invariants](./docs/Key%20Invariants%2028292878a9d2800385c7f85704314b1c.md) - Business rules

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:

```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
The API can be deployed to any Node.js hosting service:

```bash
cd apps/api
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: https://github.com/yusufsiregar44/mvp-dashboard-lite
- **Original Lovable Project**: https://lovable.dev/projects/fa98bad2-d1b3-4480-ad1b-ea6ef4beca43

---

Built with ❤️ using React, TypeScript, and modern web technologies.