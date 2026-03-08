# JS.GS

![GitHub](https://img.shields.io/github/license/DemoMacro/JS.GS)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

> Modern URL shortener with powerful analytics - Track clicks, analyze geolocation, monitor devices, and gain insights from your shortened links.

## Features

- 🔗 **Link Shortening** - Transform long URLs into short, memorable links that are easy to share and remember
- 📊 **Detailed Analytics** - Track clicks, countries, devices, browsers, and more with interactive charts
- ⏱️ **Time Series Data** - View your link performance over time with hourly, daily, and weekly aggregations
- 🌍 **Geographic Insights** - See where your clicks are coming from with country and city breakdowns
- 🎯 **UTM Tracking** - Understand your marketing campaigns with source, medium, and term tracking
- 📱 **QR Code Generation** - Generate QR codes for your short links instantly, perfect for print materials and offline marketing

## Endpoints

- `/s/[shortCode]` - Redirects to the original URL while tracking click analytics
- `/qr/[shortCode]` - Returns a QR code image for the shortened link

Complete API documentation is available at **https://js.gs/api/reference**

## Deployment

### Prerequisites

- **Node.js** 18+ runtime
- **pnpm** package manager
- **PostgreSQL** 14+ database
- **ClickHouse** server for analytics storage
- **Redis** (optional, for caching)

### Installation

```bash
# Install dependencies
pnpm install

# Build the application
pnpm run build
```

### Development

```bash
# Start development server
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

```bash
# Build the application
pnpm run build

# Start production server
pnpm run preview
```

#### Docker Deployment

> **Note**: For accurate analytics and geolocation tracking, use `host` network mode. Bridge network mode may cause the application to receive Docker's internal IP instead of the real client IP, making analytics data less useful.

##### Option 1: Using Docker Compose (Recommended)

```bash
# Copy environment variables
cp .env.example .env

# Edit .env file to configure your database and services
# nano .env

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the application
docker-compose down
```

The application will be available at `http://localhost:3000`

##### Option 2: Using Docker Run

```bash
# Pull the official image
docker pull demomacro/js.gs:latest

# Run container with host network
docker run -d \
  --name js-gs \
  --network host \
  --env-file .env \
  --restart unless-stopped \
  demomacro/js.gs:latest

# View logs
docker logs -f js-gs

# Stop the container
docker stop js-gs
docker rm js-gs
```

##### Option 3: Build from Source

```bash
# Build Docker image
docker build -t js.gs .

# Run container with host network (recommended)
docker run -d \
  --name js-gs \
  --network host \
  --env-file .env \
  --restart unless-stopped \
  js.gs

# Or use bridge network with port mapping
docker run -d \
  --name js-gs \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  js.gs
```

## Support & Community

- 📫 [Report Issues](https://github.com/DemoMacro/JS.GS/issues)

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

---

Built with ❤️ by [Demo Macro](https://www.demomacro.com/)
