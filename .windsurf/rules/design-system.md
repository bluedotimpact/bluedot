---
trigger: model_decision
description: when working on ui or visuals
---

## Design System and UI Components

- **Reference Storybook before making UI changes:** Before modifying UI components, consult the [Storybook app](http://storybook.k8s.bluedot.org/) and/or [Figma](https://www.figma.com/design/62YlFNK7QS6z7SkrPjrwVb/Blue-Dot?node-id=2-2430&p=f) to understand our design system and existing components. 

- **Reuse existing components whenever possible:** Check `libraries/ui` for existing components before creating new ones. If unsure, ask in your PR if a component already exists for your use case.

- **Maintain consistent spacing and layout:** Use the spacing variables defined in our design system rather than arbitrary pixel values.
  - Yes: `p-4` or `spacing-y`
  - No: `padding: 15px;`

- **Use design tokens for colors and styling when possible:** Avoid hardcoding color values (e.g., `#2A5D2A`). Instead, use the semantic color tokens defined in our design system (`libraries/ui/src/default-config/tailwind.css`).
  - Yes: `text-color-secondary-text` or `text-bluedot-darker`
  - No: `text-[#2A5D2A]`