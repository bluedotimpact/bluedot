# scout

Course leads review recent course participants one at a time and decide whether to invite them to an evaluation call. Everything on the card is real data read from Airtable; there is no AI in the app yet.

Currently on the branch `eleni/scout-queue`, run locally. Access: the `Is admin` flag on the Applications users table.

## Run it locally

1. Open the repo in the dev container ([setup](../../README.md#developer-setup-instructions) if it's your first time) and check out the branch:
   ```bash
   git fetch origin && git checkout eleni/scout-queue && npm install
   ```
2. Put an Airtable personal access token in `apps/scout/.env.local` (`AIRTABLE_PERSONAL_ACCESS_TOKEN=pat…`). Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`; bases: **Course runner** and **Applications**. Other values in the file can stay as they are.
3. ```bash
   cd apps/scout && npm run start
   ```
   then http://localhost:8000 and log in with your BlueDot account.

## Using it

- The queue is the locked Airtable view **Talent scouting [read by Talent Scouting App]** (Course runner › Course registration), in the view's own order. Who appears and in what order is decided there, not in code.
- Keys: `→` Invite · `←` Don't invite · `↓` skip · `n` show name.
- **Both decisions write to Airtable after a confirmation.** Don't invite sets `Talent scouting status`. Invite sets `1-1 invite source = Talent scouting app`, ticks `[!] Send 1:1 email` and sets the status; the existing Course runner automation then sends the email from the course lead. The server refuses anyone already contacted or already decided. Use **skip** to just look around.

To change the app, branch off `eleni/scout-queue` and open a PR back into it. `CLAUDE.md` in this folder explains the code to an assistant.
