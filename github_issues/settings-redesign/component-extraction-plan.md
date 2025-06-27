# Component Extraction Plan for Settings Redesign

## Analysis Summary
Based on the development guidelines in `/github_issues/DEVELOPMENT.md` and the current implementation, I've identified components that should be extracted based on the following criteria:
- Components with state management should be extracted
- Components that are truly reusable UI primitives
- Components that just fetch data without state should remain inline

## Components to Extract

### 1. ProfileNameEditor (from `/pages/settings/account.tsx`)
**Current Location**: Inline in `/pages/settings/account.tsx` (lines 22-135)

**Why Extract**:
- Has significant state management (tempName, isSaving, nameError, currentSavedName)
- Handles complex functionality (validation, API calls, error handling)
- Self-contained with clear input/output boundaries
- Would benefit from isolated testing
- Follows the "self-reliant sub-component" pattern perfectly

**Target Location**: `/apps/website/src/components/settings/ProfileNameEditor.tsx`

**Dependencies**:
- Uses axios for API calls
- Uses validation schema from `/lib/schemas/user/me.schema`
- Uses UI components from `@bluedot/ui`

**Considerations**:
- Component is already well-structured as a self-reliant component
- Has proper error handling and loading states
- Implements keyboard shortcuts (Enter/Escape)

### 2. ProfileCourseCard (from `/pages/settings/courses.tsx`)
**Current Location**: Inline in `/pages/settings/courses.tsx` (lines 125-210)

**Why Extract**:
- Complex presentation logic with conditional rendering
- Reusable across different contexts (could be used in other course listings)
- Self-contained component that receives props and renders UI
- Has significant UI complexity that would benefit from isolated testing

**Target Location**: `/apps/website/src/components/settings/ProfileCourseCard.tsx`

**Dependencies**:
- Uses icons from `react-icons/fa6`
- Uses components from `@bluedot/ui`
- Uses internal components (SocialShare, MarkdownExtendedRenderer)
- Database types from `@bluedot/db`

**Considerations**:
- Component is stateless but has complex rendering logic
- Could be made more generic for reuse in other course listing contexts

## Components to Keep Inline

### 1. CoursesList (from `/pages/settings/courses.tsx`)
**Current Location**: Inline in `/pages/settings/courses.tsx` (lines 32-89)

**Why Keep Inline**:
- Primary purpose is data fetching without complex state management
- Tightly coupled to the specific page context
- Not reusable in other contexts
- Follows the pattern of keeping data-fetching components inline

### 2. SettingsNavigation (from `/components/settings/SettingsLayout.tsx`)
**Current Location**: Already in a component file (lines 16-74)

**Why Keep Where It Is**:
- Already properly extracted in the SettingsLayout component
- Tightly coupled to SettingsLayout functionality
- Not independently reusable

### 3. SettingsBreadcrumbs (from `/components/settings/SettingsLayout.tsx`)
**Current Location**: Already in a component file (lines 77-109)

**Why Keep Where It Is**:
- Already properly extracted in the SettingsLayout component
- Tightly coupled to SettingsLayout functionality
- Uses the route structure specific to settings

## Implementation Order

1. **Extract ProfileNameEditor**
   - Move component to new file
   - Add proper imports
   - Export as default
   - Update account.tsx to import from new location

2. **Extract ProfileCourseCard**
   - Move component to new file
   - Add proper imports
   - Export as default
   - Update courses.tsx to import from new location

## File Structure After Extraction

```
/apps/website/src/
├── components/
│   └── settings/
│       ├── SettingsLayout.tsx (existing)
│       ├── SettingsLayout.test.tsx (existing)
│       ├── ProfileNameEditor.tsx (new)
│       └── ProfileCourseCard.tsx (new)
└── pages/
    └── settings/
        ├── account.tsx (updated)
        ├── courses.tsx (updated)
        └── community.tsx (unchanged)
```

## Additional Recommendations

1. **Testing**: After extraction, create test files for the extracted components:
   - `ProfileNameEditor.test.tsx`
   - `ProfileCourseCard.test.tsx`

2. **Type Safety**: Consider creating shared types file for settings-related components if types are reused

3. **Documentation**: Add JSDoc comments to extracted components explaining their purpose and usage

## Components Following Best Practices

The following components already follow the development guidelines correctly:

1. **SettingsLayout** - Properly extracted with orchestrator pattern
2. **Main page components** - Follow the pattern of handling data fetching and passing to sub-components
3. **Community page** - Simple orchestrator that doesn't need extraction

## Summary

Two components should be extracted:
1. **ProfileNameEditor** - Has state management and complex functionality
2. **ProfileCourseCard** - Complex presentation logic that's potentially reusable

All other components should remain in their current locations as they either handle data fetching or are already properly organized.