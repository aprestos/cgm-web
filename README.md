# 🎲 Congremio

**The ultimate platform for managing your board game convention - board game library, events, tournaments, flea market and more.**

congrem.io is a modern, full-featured web application designed to help organizers manage every aspect of board game gatherings—from large conventions to local libraries and tournaments. Whether you're running a community event, maintaining a game library, or organizing a competitive tournament, Congremio provides the tools you need.

---

## ✨ Features

### 🎪 Convention & Event Management
- Create and manage multiple events and editions
- Organize tournaments and competitions
- Track event schedules and timelines
- Manage multiple event locations
- Real-time countdowns and event status tracking

### 📚 Game Library Management
- Comprehensive game catalog with BoardGameGeek (BGG) integration
- Bulk import games from BGG using IDs
- Track game locations and physical inventory
- Manage game metadata and images
- Owner and allocation tracking

### 👥 User & Tenant Management
- Multi-tenant architecture for different organizations
- Role-based access control
- User authentication and authorization
- Customizable organization profiles and branding

### 📸 Media Management
- Upload and manage images and documents
- Filepond-based file uploads with validation
- Supabase cloud storage integration
- Dark mode support for all UI components

### 📱 Responsive Design
- Mobile-ready approach
- Works seamlessly on desktop, tablet, and mobile
- Progressive Web App (PWA) capabilities
- Dark/Light theme support

---

## 🛠 Tech Stack

### Frontend Framework
- **Vue 3.5+** - Progressive JavaScript framework with Composition API
- **TypeScript 5.8+** - Type-safe development
- **Vite 5+** - Lightning-fast build tool with HMR

### Styling & UI
- **Tailwind CSS 4+** - Utility-first CSS framework
- **HeadlessUI** - Unstyled, accessible components
- **Tabler Icons** - Comprehensive icon library

### State Management & Routing
- **Pinia 3** - Intuitive state management for Vue
- **Vue Router 4** - Official router for Vue applications

### Data & Backend
- **Supabase** - Open-source Firebase alternative
- **PostgreSQL** - Reliable relational database

### Form Validation
- **Regle** - Simple and elegant form validation

### Testing
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing

### Code Quality
- **ESLint 9** - JavaScript linting with strict rules
- **oxlint** - Fast, correctness-focused linter
- **Prettier** - Code formatter
- **TypeScript Strict Mode** - Comprehensive type checking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **pnpm** 8+
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Git for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/congremio.git
   cd congremio
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   pnpm run dev
   ```

   The application will be available at `http://localhost:5173`

---

## 📚 Development Guide

### Project Structure

```
src/
├── assets/              # Static assets (images, fonts, styles)
├── components/          # Reusable UI components
│   ├── CButton.vue      # Custom button component
│   ├── CInput.vue       # Custom input component
│   ├── FilePondUploadDialog.vue  # File upload component
│   └── ...
├── composables/         # Reusable composition functions
├── features/            # Feature-based modules
│   ├── auth/            # Authentication
│   ├── events/          # Event management
│   ├── library/         # Game library
│   ├── queues/          # Task queue management
│   └── ...
├── lib/                 # Shared libraries and utilities
├── router/              # Vue Router configuration
├── stores/              # Pinia state stores
├── utils/               # Utility functions
└── views/               # Page-level components
```

### Development Commands

#### Running the Development Server
```bash
pnpm run dev
```
Starts Vite dev server with HMR enabled for instant updates.

#### Type Checking
```bash
pnpm run type-check
```
Validates TypeScript types across the project. This must pass before committing.

#### Linting
```bash
pnpm run lint              # Run all linters with auto-fix
pnpm run lint:oxlint       # Fast correctness checks
pnpm run lint:eslint       # Full ESLint with strict rules
```

#### Code Formatting
```bash
pnpm run format
```
Formats code with Prettier and organizes imports.

#### Running Tests
```bash
pnpm run test:unit         # Unit tests with Vitest
pnpm run test:e2e          # E2E tests with Playwright (requires build first)
```

#### Building for Production
```bash
pnpm run build
```
Creates an optimized production build in the `dist/` directory.

#### Preview Production Build
```bash
pnpm run preview
```
Serves the production build locally for testing.

---

## 📋 Coding Standards

### TypeScript
- Use **strict mode** - all strict flags enabled
- Provide **explicit return types** for all functions
- Use `interface` over `type` for object shapes
- Avoid `any` - use `unknown` or proper types instead

### Vue 3 Component Guidelines
- Use **Composition API** with `<script setup lang="ts">` exclusively
- Define **typed props** and **emits** explicitly
- Use `ref` with explicit types: `const count = ref<number>(0)`
- Follow PascalCase for component names
- Order: imports → props → emits → refs → computed → methods → lifecycle hooks

### File Naming Conventions
- **Components**: PascalCase (`UserProfile.vue`)
- **Composables**: camelCase with `use` prefix (`useSearch.ts`)
- **Stores**: camelCase with `.store.ts` suffix (`tenant.store.ts`)
- **Utils**: camelCase (`fileUpload.ts`)
- **Types/Models**: camelCase with `.model.ts` or `.entity.ts` suffix

### Styling
- Use **Tailwind CSS** utilities primarily
- Support light and dark modes via `dark:` variants
- Use custom color scales: `primary`, `surface`, `highlight`
- Minimal custom CSS - prefer Tailwind utilities

---

## 🔄 Workflow

### Before Committing

1. **Format code:**
   ```bash
   pnpm run format
   ```

2. **Lint code:**
   ```bash
   pnpm run lint
   ```

3. **Type check:**
   ```bash
   pnpm run type-check
   ```

4. **Run tests:**
   ```bash
   pnpm run test:unit
   ```

5. **Create commit** with conventional commit message:
   ```bash
   git commit -m "feat: add new feature"
   ```

Git hooks (husky) will automatically validate commits.

---

## 🌐 Deployment

### Build for Production
```bash
pnpm run build
```

### Deploy to Vercel (Recommended)
```bash
# Connect your repository to Vercel
# The build command will automatically run: pnpm run build
# Output directory: dist
```

### Environment Variables (Production)
Set the following in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 💰 Support & Sponsorship

### Help Us Grow! 🌟

Congremio is a passion project dedicated to helping board game communities thrive. We're committed to keeping this platform **free and open** for all organizers, but we need your support to continue development.

#### Why Sponsor?

- ✅ Enable continuous feature development
- ✅ Improve performance and scalability
- ✅ Maintain and enhance infrastructure
- ✅ Support community-driven feature requests
- ✅ Keep the platform ad-free and open-source

#### Sponsorship Options

<details>
<summary><strong>💳 One-Time Donation</strong></summary>

Support us with a one-time contribution:
- **[GitHub Sponsors](https://github.com/sponsors/yourname)**
- **[PayPal](https://paypal.me/yourname)**
- **[Buy Me a Coffee](https://buymeacoffee.com/yourname)**

</details>

<details>
<summary><strong>🤝 Monthly Sponsorship</strong></summary>

Become a regular supporter with recurring monthly donations:
- **$5/month** - Community Supporter
- **$10/month** - Gold Supporter (recognized in README)
- **$25/month** - Platinum Supporter (priority feature requests)
- **$50+/month** - Diamond Supporter (dedicated support & consultation)

**[Sponsor on GitHub Sponsors →](https://github.com/sponsors/yourname)**

</details>

<details>
<summary><strong>🏢 Corporate Sponsorship</strong></summary>

Is your company interested in sponsoring Congremio?
- **Logo placement** on website and README
- **Social media recognition**
- **Custom features** development (available)
- **Technical support** priority

Contact us at: **sponsors@congremio.dev**

</details>

#### Our Sponsors 🙏

We're incredibly grateful to our sponsors who make this project possible:

- 🌟 **[Sponsor Name Here]** - Supporting Congremio since 2025
- _Be the first to support us!_

#### Alternative Ways to Help

Even if you can't financially contribute:
- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** and suggest features
- 📝 **Contribute code** via pull requests
- 📣 **Share** with your board game community
- 💬 **Provide feedback** and ideas
- 📖 **Improve documentation**

---

## 📝 License

This project is licensed under the [MIT License](LICENSE) - feel free to use, modify, and distribute.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, or documentation improvements, your help makes Congremio better.

### Getting Started with Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting

---


## 📄 Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Supabase Documentation](https://supabase.com/docs)

---

<div>

**Made with ❤️ for the board game community**

[⭐ Star us on GitHub](https://github.com/yourname/congremio) · [💬 Join our Discord](https://discord.gg/yourserver) · [💰 Sponsor the project](https://github.com/sponsors/yourname)

</div>

