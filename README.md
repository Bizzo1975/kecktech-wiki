# Custom Wiki Service

This service is the fallback replacement for BookStack when exact website parity is required.

## Feature Coverage

- Shelves/Books/Chapters/Pages hierarchy.
- Markdown content storage with revision history.
- Roles, permissions, and API token models.
- Search endpoint and tagging model.
- Comments and audit log models.
- Attachment model for gallery/files.
- API import route for migration pipeline.

## Local Run

1. Install dependencies:
   - `npm install`
2. Copy `.env.example` to `.env` and set values.
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Start:
   - `npm run dev`

## Migration

Use `scripts/migrate-bookstack.js` with both BookStack API and custom wiki API credentials configured.
