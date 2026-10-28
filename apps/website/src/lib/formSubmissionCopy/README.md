# Send a copy of form submissions

Emails applicants a copy of their answers after they submit a form. The current forms are miniExtensions forms: each one's "Trigger a webhook after save" points at `POST /api/form-submission-copy?token=<token>&form=<config key>`, miniExtensions appends `recordId`, and the route reads the record from Airtable, renders the fields in the form's config and sends them through the customer.io transactional message `form_submission_copy`.

## Why this reads Airtable directly

Everything else in the website reads Postgres through `@bluedot/db`. This feature does not, because:

- Forms have many fields, most of which the website never uses, and (for miniExtensions at least) there is no way to fetch the set of fields a form writes. So the fields to copy, and the fields to ignore, have to be listed in code, and syncing them all into Postgres just to echo them back would tie the schema to form content.
- The copy must go out the moment the form saves, before the sync has run.

Fields are pinned by Airtable field id, so renames in Airtable change nothing; the field name sits beside each id as a comment for readability only.

## Making changes

Field ids are on the base's API page (`https://airtable.com/<baseId>/api/docs`) or in the Meta API response for the base.

- A form gains a question: add the field to that form's `fieldAllowList` with the question wording as the label. If applicants should not see it echoed back, add it to the deny list instead. Until then each submission alerts.
- A form drops a question: remove it from the allow list. If it was `required`, the alert says so.
- A new form: copy an existing config, then set the form's webhook URL in miniExtensions with `form=` set to the new key. The token is `deriveFormSubmissionCopyToken()` for the production `AIRTABLE_AUTOMATION_TOKEN`.
- A field is added to the table but not to any form: add it to the deny list. Airtable leaves empty fields out of the record, so this only comes up once a record arrives with the field filled in, and the alert gives the id. Fine to fix on first alert.
