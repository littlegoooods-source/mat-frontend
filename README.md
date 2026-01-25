# Workshop Management Frontend

React frontend for workshop inventory and production management system.

## Features

- Dashboard with key metrics
- Materials management
- Material receipts tracking
- Product recipes with cost calculation
- Production management
- Finished products (sales, write-offs)
- Operation history

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide Icons

## Pages

- `/dashboard` - Overview and statistics
- `/materials` - Material catalog
- `/receipts` - Material receipts
- `/products` - Product recipes
- `/productions` - Production records
- `/finished-products` - Finished goods inventory
- `/history` - Operation log

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Running Locally

```bash
npm install
npm run dev
```

App will be available at http://localhost:3000

## Building for Production

```bash
npm run build
```

Built files will be in `dist/` directory.

## Docker

```bash
docker build -t mat-frontend --build-arg VITE_API_URL=https://your-backend-url .
docker run -p 80:80 mat-frontend
```

## Deploy to Render.com

1. Connect this repository to Render
2. Select "Docker" environment
3. Add environment variable: `VITE_API_URL=https://mat-backend.onrender.com`

## License

MIT
