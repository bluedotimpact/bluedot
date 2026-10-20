---
name: bluedot-figma
description: Design BlueDot screens in Figma using the BlueDot Design System. Use this skill whenever the user asks to design, redesign, revamp, recreate or mock up any BlueDot page, screen, form or flow in Figma, whether from the codebase, a screenshot/image, or a brief — even if they don't mention the design system by name. For BlueDot screens, use this instead of the generic Figma design skills.
---

# Designing in Figma with the BlueDot Design System

Build only from the design system. When the system has a gap, say so.

Design system file: https://www.figma.com/design/b48ano1xNhjFlspfahUkGn/BlueDot-Design-System

## 1. Check setup

Confirm you can read the design system file through the Figma MCP. If you cannot, stop and tell the user.

The Figma design system is the source of truth. The repo shows how the rest of the app works, but a pattern that only exists in the repo is not part of the system (see the rules in section 4).

## 2. Confirm the task

Before designing, play back your understanding to the user and wait for confirmation. Cover:

- **Task type**: recreate or redesign an existing page, build from an image, or design from a brief (see section 4)
- **What to design**: which pages or screens, and the source for each (codebase route, image, Figma link, or brief)
- **Where the design goes**: always ask. Options are a new Figma file, a new page in an existing file, or a specific location the user names. Don't assume.
- **For a redesign**: what to change and what must stay.
- **For a brief**: who the page is for, what they must do on it, and what content it holds. Ask if the brief doesn't say.

## 3. Read the design system

Read the design system before designing. Build a picture of:

- Components, their variants and properties
- Colour, spacing, typography and radius variables
- Any layout patterns or page templates

Cross-check with `libraries/ui/README.md`, `apps/storybook/src/GettingStarted.mdx` and `libraries/ui/src/default-config/tailwind.css`.

## 4. Design

- **Recreate or redesign an existing page**: read the page in the repo, including its layout, components, content and states. To recreate, match its structure and content. To redesign, change what the user asked for in step 2, keep the rest, and briefly explain your main changes.
- **From an image**: treat the image as the spec for content and structure. Map each element to the closest design system component.
- **From a brief**: look at similar pages in the repo so the new page's layout and navigation fit the app. Briefly explain your main choices and any assumptions.

### Rules for all task types
- Use an instance of a component wherever one exists. Never detach an instance.
- Bind every colour, spacing, typography and radius value to a design system variable. If no variable fits, hard-code it and log it as a gap.
- If the design system lacks something but the repo has a pattern for it, don't use the pattern silently. Tell the user it comes from the repo, not the design system, and ask whether to use it. Log it as a gap either way.
- Use auto layout.
- Use realistic mock data, unless the design is the empty state.
- Name frames and layers clearly.
- Text meets WCAG AA contrast: 4.5:1 for body text, 3:1 for large text.

## 5. Annotate gaps

Add a canvas annotation for each gap:

| What's needed | What's missing | Workaround used | Suggested fix |
|---|---|---|---|
| e.g. Progress indicator for unit completion | No progress component | Built from a Frame + variables | New component |

Suggested fix should be one of: **new component**, **new variant** of an existing component, **new token**, or **pattern break**. Note repo patterns that the design system lacks.

## 6. Report back

Tell the user what you made and where, the gaps and what you are unsure about.
