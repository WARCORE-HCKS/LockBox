# Contributing to LockBox

First off, thank you for considering contributing to LockBox! It's people like you that make LockBox such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by respect, kindness, and professionalism. By participating, you are expected to uphold this standard.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, browser, version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how it would be used**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing code style
5. Write a convincing description of your PR and why we should land it

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/lockbox.git
cd lockbox

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Code Style

- Use TypeScript for type safety
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Good commit messages:**
```
Add user profile editing functionality

- Create ProfilePage component with form
- Add PATCH /api/profile endpoint
- Implement validation with Zod schema
- Update documentation

Fixes #123
```

### Testing

Before submitting a PR:

```bash
# Run linter (if configured)
npm run lint

# Build the project
npm run build

# Test the application manually
npm run dev
```

### Project Structure

```
lockbox/
├── client/          # Frontend (React + TypeScript)
├── server/          # Backend (Express + Socket.IO)
├── shared/          # Shared types and schemas
└── attached_assets/ # Static assets
```

### Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express, Socket.IO, Passport.js
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)

## Styleguides

### TypeScript Styleguide

- Always use TypeScript, not JavaScript
- Define interfaces for all data structures
- Use type inference where possible
- Avoid `any` type unless absolutely necessary

### React Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow existing color scheme and design patterns
- Ensure dark mode support for all UI elements
- Keep responsive design in mind

## What Should I Know Before I Get Started?

### Architecture Overview

**Frontend (client/)**
- React application with TypeScript
- Uses `wouter` for routing
- TanStack Query for data fetching
- Socket.IO client for real-time features

**Backend (server/)**
- Express server with Socket.IO
- Passport.js for authentication
- Drizzle ORM for database access
- Session-based authentication

**Database (shared/schema.ts)**
- PostgreSQL database
- Drizzle ORM schemas
- Zod validation schemas

### Important Patterns

1. **Authentication**: All protected routes use `isAuthenticated` middleware
2. **Real-time**: Socket.IO for instant message delivery
3. **Encryption**: Client-side AES encryption (see security notes)
4. **State Management**: React Query for server state, React hooks for local state

## Security Considerations

When contributing, keep in mind:

- Never expose secrets or API keys
- All user inputs must be validated (client + server)
- Socket.IO events must verify user authentication
- Be aware this is a demo - encryption is simplified

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## Recognition

Contributors will be recognized in the project. Thank you for making LockBox better!
