# iCode

`iCode` is now split into a routed frontend and an Express backend.

## Structure

- `frontend/`: Vite app, routed pages, UI components, and client-side helpers
- `backend/`: Express server, compiler prompt/config logic, and Convex functions
- `shared/`: contracts shared by frontend and backend

## Routes

- `/`: landing page
- `/utilities`: hub for the main product surfaces
- `/smart-compiler`: dedicated compiler page
- `/classroom`: classroom mode workspace
- `/teacher`: teacher dashboard
- `/teacher/session/:roomId`: full-screen teacher intervention view

## Scripts

- `npm run dev`: start the Express server with Vite middleware
- `npm run build`: build the frontend into `frontend/dist`
- `npm run start`: start the server
