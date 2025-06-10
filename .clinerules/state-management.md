## State Management

- **Use Zustand for complex state management:** For complex state that needs to be shared across components, use Zustand stores rather than deeply nested prop drilling or complex React Context usage.

- **Keep component state local when possible:** Only lift state up when necessary. Start with local state (`useState`) and migrate to shared state as needed.

- **Use Zod to validate environment variables:** When accessing environment variables, ensure they're validated using Zod.