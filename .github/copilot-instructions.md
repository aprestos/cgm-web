# GitHub Copilot Instructions for congremio

## Project Overview

This is a Vue 3 application built with TypeScript, Vite, and Tailwind CSS. The project follows a feature-based architecture and uses strict TypeScript and ESLint configurations.

## Tech Stack

- **Framework**: Vue 3.5+ (Composition API with `<script setup>`)
- **Language**: TypeScript 5.8+
- **Build Tool**: Vite 6+
- **Styling**: Tailwind CSS 4+ with custom theme
- **State Management**: Pinia
- **Router**: Vue Router 4+
- **Testing**: Vitest (unit tests) and Playwright (E2E tests)
- **UI Components**: PrimeVue, HeadlessUI, custom components
- **Linting**: ESLint with strict rules + oxlint

## Coding Standards

### TypeScript

- Use **strict mode** with all strict flags enabled
- Always provide **explicit return types** for functions
- Use **type imports** (`import type`) for type-only imports
- Prefer `interface` over `type` for object shapes
- Avoid using `any` - use `unknown` or proper types instead
- Enable and respect all TypeScript compiler warnings

### Vue 3 Conventions

- Use **Composition API** with `<script setup lang="ts">` syntax exclusively
- Always define **typed props** and **emits** explicitly
- Use `defineProps`, `defineEmits`, and `defineExpose` for component API
- Require default values for props where appropriate
- Use `ref` with explicit types: `const count = ref<number>(0)`
- Follow Vue 3 style guide for component naming (PascalCase for components)
- Use `computed` for derived state, `watch` for side effects

### Component Structure

- Order in `<script setup>`: imports, props, emits, refs, computed, methods, lifecycle hooks
- Keep components focused and single-responsibility
- Extract reusable logic into composables (files in `src/composables/`)
- Use TypeScript for all script sections

### Styling

- Use **Tailwind CSS** utility classes primarily
- Follow the custom theme defined in the `@theme` block of `src/index.css` (Tailwind v4 is CSS-first; there is no `tailwind.config.js`)
- Use `primary`, `surface`, and `highlight` custom color scales
- Support both light and dark modes via `dark:` variants
- Use CSS custom properties (CSS variables) from the theme
- Keep custom CSS minimal; prefer Tailwind utilities

### Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
├── composables/     # Reusable composition functions
├── features/        # Feature-based modules (settings, etc.)
├── lib/             # Shared libraries and utilities
├── navigation/      # Navigation-related components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
├── utils/           # Utility functions
└── views/           # Page-level components
```

### State Management

- Use **Pinia** for global state
- Create stores in `src/stores/` or within feature directories
- Use composition API style for stores
- Keep stores focused on specific domains

### File Naming

- Components: PascalCase (e.g., `UserProfile.vue`)
- Composables: camelCase with `use` prefix (e.g., `useSearch.ts`)
- Stores: camelCase with `.store.ts` suffix (e.g., `tenant.store.ts`)
- Utils: camelCase (e.g., `fileUpload.ts`)
- Types/Models: camelCase with `.model.ts` or `.entity.ts` suffix

## Development Commands

### Installation
```bash
pnpm install
```

### Development Server
```bash
pnpm run dev
```

### Type Checking
```bash
pnpm run type-check
```

### Building
```bash
pnpm run build
```

### Linting
```bash
pnpm run lint              # Runs both oxlint and eslint with auto-fix
pnpm run lint:oxlint       # Fast correctness checks
pnpm run lint:eslint       # Full ESLint with all rules
```

### Formatting
```bash
pnpm run format            # Format code with Prettier
```

### Testing
```bash
pnpm run test:unit         # Run unit tests with Vitest
pnpm run test:e2e          # Run E2E tests with Playwright
```

## Code Quality Requirements

### Before Committing

1. **Type check** must pass: `pnpm run type-check`
2. **Linting** must pass: `pnpm run lint`
3. **Tests** should pass: `pnpm run test:unit`
4. Code should be **formatted**: `pnpm run format`

### ESLint Rules

This project uses **strict ESLint rules**:
- Explicit function return types required
- Explicit module boundary types required
- No floating promises
- Consistent type imports
- Member ordering enforced
- Vue-specific strict rules (typed refs, prop types, emit validators)

### Testing

- Write unit tests for business logic and composables
- Write E2E tests for critical user workflows
- Place unit tests next to the code they test (`*.spec.ts` or `*.test.ts`)
- Place E2E tests in the `e2e/` directory

## Important Notes

### Dependencies Management

- Use **npm** for package management
- Run `pnpm install` to add new dependencies
- Update `package.json` with exact versions when needed

### Git Workflow

- Use conventional commit messages
- Commits are automatically linted via husky pre-commit hook
- Lint-staged runs ESLint on staged files before commit

### Async Operations

- Always handle promises properly (no floating promises)
- Use `async/await` over raw promises for readability
- Ensure proper error handling for async operations

### Accessibility

- Follow WCAG 2.1 AA guidelines
- Ensure proper semantic HTML
- Test keyboard navigation
- Include ARIA labels where appropriate

## Common Patterns

### Composables Example
```typescript
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref<number>(initialValue)
  const doubleCount = computed(() => count.value * 2)
  
  function increment(): void {
    count.value++
  }
  
  return {
    count,
    doubleCount,
    increment,
  }
}
```

### Component Example
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  count?: number
}

interface Emits {
  (e: 'update', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<Emits>()

const localCount = ref<number>(props.count)
const displayText = computed(() => `${props.title}: ${localCount.value}`)

function handleClick(): void {
  localCount.value++
  emit('update', localCount.value)
}
</script>

<template>
  <div class="p-4 bg-surface-50 dark:bg-surface-900">
    <p class="text-primary">{{ displayText }}</p>
    <button 
      @click="handleClick"
      class="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
    >
      Increment
    </button>
  </div>
</template>
```

## Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
