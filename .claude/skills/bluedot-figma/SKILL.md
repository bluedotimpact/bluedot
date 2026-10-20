---
name: bluedot-figma
description: Design BlueDot screens in Figma using the BlueDot Design System. Use this skill whenever the user asks to design, redesign, revamp, recreate or mock up any BlueDot page, screen, form or flow in Figma, whether from the codebase, a screenshot/image, or a brief — even if they don't mention the design system by name.
---

# Designing in Figma with the BlueDot Design System

The goal is designs that are built entirely from the design system, so they stay consistent with the product and can be handed to engineering without translation. Where the system can't cover something, say so clearly rather than improvising quietly: those gaps are how the system improves.

Design system file: https://www.figma.com/design/b48ano1xNhjFlspfahUkGn/BlueDot-Design-System

## 1. Check your setup

Before anything else, check what you have access to:

- **Figma MCP**: confirm you can read the design system file above. If you can't, stop and tell the user.
- **BlueDot repo**: check whether the BlueDot repo (cloned locally from GitHub) is available in this session. The repo shows how the rest of the app actually works, including patterns and components that aren't codified in the design system yet. If it isn't available, tell the user and ask whether to continue without it. Working from an image can go ahead without it. Recreating or redesigning an existing page needs it. Designing from a brief can go ahead without it, but the result is more likely to drift from the rest of the app.

## 2. Confirm the task

Before designing, play back your understanding to the user and wait for confirmation. Cover:

- **Task type**: 4.1 recreate an existing page, 4.2 build from an image/reference, 4.3 redesign an existing page, or 4.4 design from a brief (see section 4)
- **What to design**: which pages or screens, and the source for each (codebase route, image, Figma link, or brief)
- **Where the design goes**: always ask. Options are a new Figma file, a new page in an existing file, or a specific location the user names. Don't assume.

## 3. Read the design system

Read the design system before designing, not while designing. Build a picture of:

- The available components, their variants and properties
- The colour, spacing, typography and radius variables
- Any layout patterns or page templates

This matters because the most common failure is reaching for a close-enough custom element when a proper component exists.

## 4. Design

### 4.1 Recreating an existing page (from the codebase)
Read the page in the repo: its layout, the components it uses, its content and states. Then rebuild it in Figma using design system components. Match the structure and content of the real page; don't redesign it.

### 4.2 Building from an image or reference
Treat the image as the spec for content and structure. Map each element to the closest design system component. If the reference shows something the system doesn't have, note it as a gap rather than drawing it freehand.

### 4.3 Redesigning an existing page
Read the current page in the repo first so you understand what it does and what content it needs. Then design an improved version using the design system. Keep all existing functionality unless the user says otherwise, and briefly explain the main changes you made and why.

### 4.4 Designing from a brief (e.g. a whole new page)
There's no existing page or reference to work from, so the brief is the spec. Before designing, make sure you understand who the page is for, what they need to do on it, and what content it holds; if the brief doesn't say, ask as part of step 2. Look in the repo for similar pages and how they're laid out and navigated, so the new page feels like part of the same app. Then design it using the design system, and briefly explain your main layout and component choices and any assumptions you made to fill gaps in the brief.

### Rules for all task types
- Wherever a design system component exists for an element, use an instance of it. Never detach an instance. Plain frames and text layers are fine for layout and content, and for gaps you annotate (see section 5).
- Bind every colour, spacing, typography and radius value to a design system variable. No hard-coded values.
- Use auto layout.
- Fill designs with realistic mock data (course names, units, dates, user names) so they don't show an empty state, unless the empty state is what's being designed.
- Name frames and layers clearly.

## 5. Annotate gaps

On the canvas, add an annotation wherever the design system couldn't meet the need. For each gap, record:

| What's needed | What's missing | Workaround used | Suggested fix |
|---|---|---|---|
| e.g. Progress indicator for unit completion | No progress component | Built from a Frame + variables | New component |

Suggested fix should be one of: **new component**, **new variant** of an existing component, **new token**, or **pattern break** (a one-off that probably shouldn't be added to the system).

If the repo contains a pattern that isn't in the design system, note that too: it's a candidate for codifying.

## 6. Check before finishing

Before reporting back, review your own output:

- Any hard-coded values or detached instances? Fix them or log them as gaps.
- Does text meet colour contrast requirements?
- Is every gap annotated on the canvas?

Then give the user a short summary: what you created and where, the list of gaps, and anything you were unsure about.
