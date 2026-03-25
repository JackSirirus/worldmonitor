# WorldMonitor Agent System - Quick Start Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ Zustand │  │  WS    │  │ Agent  │  │ Components  │ │
│  │ Stores  │◄─┤ Hook   │◄─┤ Panel  │  │ (existing)  │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / WebSocket
┌──────────────────────▼─────────────────────────────────┐
│                   Backend (Express)                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  REST   │  │   WS    │  │     Agent System      │ │
│  │   API   │  │ Server  │  │  (RSS, Analysis, etc) │ │
│  └────┬─────┘  └────┬─────┘  └───────────┬────────────┘ │
│       │            │                    │             │
│  ┌────▼────────────▼────────────────────▼──────────┐  │
│  │              Repositories Layer                 │  │
│  │  (news, reports, tasks, logs, tools)           │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                                │
│  ┌────────────────────▼───────────────────────────┐    │
│  │         PostgreSQL + Redis                     │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start Development Server

```bash
# Frontend
npm run dev

# Backend (separate terminal)
cd server && npm run dev
```

### 2. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

### 3. Test the Agent System

```bash
# Trigger RSS collection
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type": "rss-collect"}'

# Check task status
curl http://localhost:3001/api/tasks

# Get news
curl http://localhost:3001/api/news

# Check health
curl http://localhost:3001/api/health
```

## API Endpoints

### News

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | List news with pagination |
| GET | `/api/news/:id` | Get news by ID |
| GET | `/api/news/search` | Search news |
| GET | `/api/news/categories` | List categories |
| GET | `/api/news/stats` | Get news statistics |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get task by ID |
| GET | `/api/tasks/stats` | Get task statistics |
| POST | `/api/tasks` | Create new task |
| POST | `/api/tasks/trigger` | Trigger task |

### Tools (Agent Jobs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tools` | List tools |
| POST | `/api/tools` | Create tool |
| PUT | `/api/tools/:id` | Update tool |
| DELETE | `/api/tools/:id` | Delete tool |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | List logs |
| GET | `/api/logs/task/:id` | Get logs for task |
| GET | `/api/logs/errors` | Get error logs |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full health check |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |
| GET | `/api/metrics` | System metrics |
| GET | `/api/alerts` | Alert status |

## Agent Types

1. **rss-collect**: Collects RSS feeds
2. **data-analysis**: Analyzes news trends
3. **report**: Generates daily reports
4. **web-search**: Web search capability
5. **deep-thinking**: In-depth topic analysis
6. **fact-check**: Fact verification

## WebSocket Channels

Subscribe to real-time updates:

```javascript
// Connect
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to channels
ws.send(JSON.stringify({ type: 'subscribe', payload: 'agents' }));
ws.send(JSON.stringify({ type: 'subscribe', payload: 'tasks' }));
ws.send(JSON.stringify({ type: 'subscribe', payload: 'news' }));
ws.send(JSON.stringify({ type: 'subscribe', payload: 'logs' }));
```

## Environment Variables

### Required

```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
```

### Optional

```
GROQ_API_KEY=sk-xxx          # AI summarization
OPENROUTER_API_KEY=sk-or-xxx # Fallback AI
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
PORT=3001
NODE_ENV=development
```

## Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Troubleshooting

### Check logs
```bash
docker-compose logs backend
```

### Check database connection
```bash
curl http://localhost:3001/api/health
```

### Restart agents
```bash
curl -X POST http://localhost:3001/api/tasks -d '{"type": "rss-collect"}'
```
