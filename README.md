
# Kakebe Shop Backend Dashboard

A React-based admin dashboard for managing the Kakebe e-commerce backend.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
cd dashboard
npm install
```

## Running the Project

### Development Mode
```bash
npm run dev
```
This starts the development server at `http://localhost:5173`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
dashboard/
├── src/
│   ├── api/           # API endpoints and services
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and helpers
│   ├── pages/         # Page components
│   ├── store/         # Zustand state stores
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Environment Variables

Create a `.env.local` file in the dashboard directory:

```env
VITE_API_URL=your_api_url_here
```

## License

MIT
>>>>>>> bbb5fee (Initial commit: Kakebe Shop Backend Dashboard)
