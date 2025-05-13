import { useAuthStore } from './auth';

/**
 * Spread into the props of a Story to render it as logged out, like so:
 * ```typescript
 * export const LoggedOut: Story = {
 *    args: {},
 *    ...loggedOutStory(),
 *  };
 * ```
 *
 * Since stories are logged out by default, this his is most useful in the `meta`
 * story definition when you have some logged in stories to ensure it resets to
 * logged out between rendering:
 * ```typescript
 * const meta = {
 *   title: 'ui/MyComponent',
 *   component: MyComponent,
 *   tags: ['autodocs'],
 *   parameters: {
 *     layout: 'fullscreen',
 *   },
 *   args: {
 *   },
 *   ...loggedOutStory(),
 * } satisfies Meta<typeof MyComponent>;
 * ```
 */
export const loggedOutStory = () => ({
  beforeEach() {
    useAuthStore.getState().setAuth(null);
  },
});

/**
 * Spread into the props of a Story to render it as logged in, like so:
 * ```typescript
 * export const LoggedIn: Story = {
 *    args: {},
 *    ...loggedInStory(),
 *  };
 * ```
 */
export const loggedInStory = () => ({
  beforeEach() {
    // Call the *real* setAuth function to set the state
    useAuthStore.getState().setAuth({
      token: 'mockToken',
      expiresAt: Date.now() + 3600000, // Expires in 1 hour
      email: 'test+storybook@bluedot.org',
    });
  },
});
