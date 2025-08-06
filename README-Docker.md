# Saimon.ca Docker Setup

This repository includes Docker configuration for easy deployment of the saimon.ca AI/ML Labs website.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and run the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at http://localhost:3000

### Using Docker directly

```bash
# Build the image
docker build -t saimon-app .

# Run the container
docker run -d -p 3000:80 --name saimon-container saimon-app

# View logs
docker logs saimon-container

# Stop and remove container
docker stop saimon-container && docker rm saimon-container
```

## Development

For development, you can still use the standard Vite development server:

```bash
npm install
npm run dev
```

## Production Deployment

### Environment Variables

You can customize the deployment using environment variables:

```bash
# Set custom port
docker-compose up -d -e PORT=8080
```

### Health Checks

The container includes health checks accessible at:
- `http://localhost:3000/health` - Application health status

### SSL/HTTPS Setup

For production deployments with SSL, uncomment the nginx-proxy service in `docker-compose.yml` and configure your SSL certificates.

## Container Details

- **Base Image**: nginx:alpine (production), node:18-alpine (build stage)
- **Port**: 80 (internal), mapped to 3000 (host)
- **Health Check**: Built-in health endpoint
- **Compression**: Gzip enabled for static assets
- **Caching**: 1-year cache for static assets
- **Security**: Security headers included

## Customization

### Nginx Configuration

Modify `nginx.conf` to customize:
- Server settings
- Security headers
- Caching policies
- Proxy configurations

### Docker Configuration

Modify `Dockerfile` to:
- Change Node.js version
- Add additional build steps
- Install system dependencies

## Troubleshooting

### Container won't start
```bash
# Check container logs
docker-compose logs saimon-app

# Check if port is in use
netstat -tulpn | grep :3000
```

### Build issues
```bash
# Clean build
docker-compose build --no-cache

# Remove all containers and images
docker system prune -a
```
