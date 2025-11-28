---
layout: default
title: "Deployment Guide - Discord Agent MCP"
description: "Deploy Discord Agent MCP to production. Docker, Kubernetes, and local deployment options with configuration guides."
keywords: "Discord bot deployment, Docker Discord bot, Kubernetes Discord, MCP server hosting, Discord bot hosting"
permalink: /deployment/
---

# Deployment Guide

Deploy Discord Agent MCP to production with Docker, Kubernetes, or run it locally. This guide covers all deployment options with best practices.

---

## Deployment Options

| Method | Best For | Complexity |
|--------|----------|------------|
| [Local](#local-deployment) | Development, testing | Low |
| [Docker](#docker-deployment) | Single server, VPS | Medium |
| [Docker Compose](#docker-compose) | Multi-container setups | Medium |
| [Kubernetes](#kubernetes-deployment) | Production, scaling | High |

---

## Local Deployment

Run the server directly on your machine for development or small-scale use.

### Prerequisites

- Node.js 20.0.0+
- npm or yarn

### Setup

```bash
# Clone and install
git clone https://github.com/aj-geddes/discord-agent-mcp.git
cd discord-agent-mcp
npm install

# Configure
cp .env.example .env
# Edit .env with your DISCORD_TOKEN

# Build and run
npm run build
npm start
```

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

### Running as a Service (systemd)

Create `/etc/systemd/system/discord-mcp.service`:

```ini
[Unit]
Description=Discord Agent MCP Server
After=network.target

[Service]
Type=simple
User=discord
WorkingDirectory=/opt/discord-agent-mcp
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable discord-mcp
sudo systemctl start discord-mcp
sudo systemctl status discord-mcp
```

---

## Docker Deployment

Deploy with Docker for consistent, isolated environments.

### Build the Image

```bash
docker build -t discord-mcp-server:latest .
```

### Run the Container

```bash
docker run -d \
  --name discord-mcp \
  -p 3000:3000 \
  -e DISCORD_TOKEN=your_token_here \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  discord-mcp-server:latest
```

### Verify It's Running

```bash
# Check container status
docker ps

# View logs
docker logs -f discord-mcp

# Test health endpoint
curl http://localhost:3000/health
```

### Container Management

```bash
# Stop the container
docker stop discord-mcp

# Start it again
docker start discord-mcp

# Remove the container
docker rm -f discord-mcp

# Update to new version
docker pull discord-mcp-server:latest
docker stop discord-mcp
docker rm discord-mcp
docker run -d --name discord-mcp ... # (same options as above)
```

### Using Environment File

Create `docker.env`:

```bash
DISCORD_TOKEN=your_token_here
TRANSPORT_MODE=http
HTTP_PORT=3000
LOG_LEVEL=info
LOG_FORMAT=json
```

Run with env file:

```bash
docker run -d \
  --name discord-mcp \
  -p 3000:3000 \
  --env-file docker.env \
  --restart unless-stopped \
  discord-mcp-server:latest
```

---

## Docker Compose

Use Docker Compose for easier management and multi-container setups.

### Basic docker-compose.yml

```yaml
version: '3.8'

services:
  discord-mcp:
    build: .
    container_name: discord-mcp
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT_MODE=http
      - HTTP_PORT=3000
      - LOG_LEVEL=info
      - LOG_FORMAT=json
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### With Reverse Proxy (Traefik)

```yaml
version: '3.8'

services:
  discord-mcp:
    build: .
    container_name: discord-mcp
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT_MODE=http
      - HTTP_PORT=3000
      - LOG_LEVEL=info
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.discord-mcp.rule=Host(`mcp.yourdomain.com`)"
      - "traefik.http.routers.discord-mcp.tls=true"
      - "traefik.http.routers.discord-mcp.tls.certresolver=letsencrypt"
      - "traefik.http.services.discord-mcp.loadbalancer.server.port=3000"
    networks:
      - traefik

  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - traefik

networks:
  traefik:
    external: true

volumes:
  traefik-certs:
```

### Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Kubernetes Deployment

Deploy to Kubernetes for production-grade reliability and scaling.

### Prerequisites

- Kubernetes cluster (K3s, EKS, GKE, AKS, etc.)
- kubectl configured
- (Optional) Helm for package management

### Manifests

The repository includes ready-to-use Kubernetes manifests in the `k8s/` directory.

#### 1. Create Namespace

`k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: discord-agent-mcp
```

#### 2. Create Secret

`k8s/secret.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: discord-mcp-secret
  namespace: discord-agent-mcp
type: Opaque
stringData:
  DISCORD_TOKEN: "your_bot_token_here"
```

> **Important**: Never commit secrets to version control. Use `kubectl create secret` or a secrets manager instead.

#### 3. Create ConfigMap

`k8s/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: discord-mcp-config
  namespace: discord-agent-mcp
data:
  TRANSPORT_MODE: "http"
  HTTP_PORT: "3000"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
```

#### 4. Create Deployment

`k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: discord-mcp-server
  namespace: discord-agent-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: discord-mcp-server
  template:
    metadata:
      labels:
        app: discord-mcp-server
    spec:
      containers:
        - name: discord-mcp
          image: discord-mcp-server:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: discord-mcp-secret
            - configMapRef:
                name: discord-mcp-config
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### 5. Create Service

`k8s/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: discord-mcp-server
  namespace: discord-agent-mcp
spec:
  selector:
    app: discord-mcp-server
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP
```

### Deploy to Cluster

```bash
# For local clusters (K3d), load the image first
docker build -t discord-mcp-server:latest .
k3d image import discord-mcp-server:latest -c your-cluster

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n discord-agent-mcp

# Check logs
kubectl logs -n discord-agent-mcp -l app=discord-mcp-server -f

# Port forward to test
kubectl port-forward -n discord-agent-mcp svc/discord-mcp-server 3000:3000

# Test health endpoint
curl http://localhost:3000/health
```

### Ingress (Optional)

For external access, create an Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: discord-mcp-ingress
  namespace: discord-agent-mcp
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - mcp.yourdomain.com
      secretName: discord-mcp-tls
  rules:
    - host: mcp.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: discord-mcp-server
                port:
                  number: 3000
```

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | **Yes** | - | Discord bot token |
| `TRANSPORT_MODE` | No | `http` | `http` or `stdio` |
| `HTTP_PORT` | No | `3000` | HTTP server port |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | No | `json` | `json` or `pretty` |
| `RECONNECT_MAX_RETRIES` | No | `5` | Max reconnection attempts |
| `RECONNECT_BACKOFF_MS` | No | `1000` | Reconnection backoff |

### Health Check

The `/health` endpoint returns:

```json
{
  "status": "healthy",
  "discord": "connected"
}
```

Use this for:
- Load balancer health checks
- Kubernetes probes
- Monitoring systems

---

## Security Best Practices

### Token Management

- **Never** commit tokens to version control
- Use environment variables or secrets managers
- Rotate tokens periodically
- Revoke tokens immediately if exposed

### Network Security

- Use HTTPS in production (via reverse proxy)
- Restrict access to trusted IPs if possible
- Use network policies in Kubernetes
- Monitor for unusual traffic patterns

### Container Security

- Run as non-root user
- Use read-only filesystem where possible
- Scan images for vulnerabilities
- Keep base images updated

### Kubernetes Security

- Use RBAC to limit permissions
- Use network policies
- Enable pod security policies
- Use secrets management (Vault, etc.)

---

## Monitoring

### Logging

The server outputs structured JSON logs:

```json
{
  "level": "info",
  "message": "Tool executed",
  "tool": "send_message",
  "duration": 150,
  "success": true
}
```

### Metrics (Future)

Prometheus metrics endpoint planned for future release.

### Alerting Suggestions

Set up alerts for:
- Health check failures
- High error rates
- Discord disconnections
- Resource exhaustion

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs discord-mcp

# Common issues:
# - Invalid DISCORD_TOKEN
# - Port already in use
# - Missing environment variables
```

### Discord Connection Issues

```bash
# Verify token is set
docker exec discord-mcp printenv | grep DISCORD

# Check Discord API status
curl -I https://discord.com/api/v10
```

### Health Check Failing

```bash
# Test manually
curl http://localhost:3000/health

# Check container is running
docker ps

# Check container logs for errors
docker logs --tail 100 discord-mcp
```

---

## Next Steps

- [Tools Reference]({{ '/tools/' | relative_url }})
- [Interactive Prompts]({{ '/prompts/' | relative_url }})
- [Troubleshooting Guide]({{ '/troubleshooting/' | relative_url }})
