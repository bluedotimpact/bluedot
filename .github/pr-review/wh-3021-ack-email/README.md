# Group switch request acknowledgement email — customer.io templates

Temporary, for PR review only; removed before merge. Source of truth once set up is the customer.io campaign.

Campaign: "Send: Group switch request acknowledgement", triggered by event `Group switch requested`, sent from `BlueDot Impact <team@bluedot.org>`. Branch on `event.isManualRequest`; each template handles both values of `event.switchType` itself.

- `manual-request.md` — `isManualRequest == true`
- `self-serve.md` — `isManualRequest == false`

Payload fields (all camelCase, from `sendSwitchRequestedAckEmail` in `apps/website/src/server/routers/group-switching.ts`):

- Always: `switchType`, `isManualRequest`, `notesFromParticipant` (may be empty), `courseName`, `courseLink`
- One unit: `unitNumber`, `unitTitle`, `oldDiscussionStartTime` (unix seconds)
- Self-serve: `newGroupName`; one unit also `newDiscussionStartTime`
- Manual: `availabilityLink`
- `oldGroupName` is usually present but can be missing (participant not in any group); `unitNumber`/`unitTitle` can be missing when the unit record is gone and the discussion has no fallback title. The templates guard every one of these.

Times render in UTC, matching the existing "Cohort switching update" campaign. `{{ snippets.hello }}` and `{{ snippets.footer }}` are the shared workspace snippets.
