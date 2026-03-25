# Implementation Tasks

## 1. Phase 1: Infrastructure Setup

### 1.1 Server & Docker Environment

> **Note**: These tasks require manual server setup and are prerequisites for deployment.

- [ ] 1.1.1 Provision cloud server (Aliyun/AWS EC2) - **Manual**
- [ ] 1.1.2 Install Docker and Docker Compose - **Manual**
- [ ] 1.1.3 Configure server firewall (only allow 22, 80, 443) - **Manual**
- [ ] 1.1.4 Setup domain and DNS records - **Manual**

### 1.2 Database Setup

- [x] 1.2.1 Deploy PostgreSQL container
- [x] 1.2.2 Configure PostgreSQL (timezone, max connections)
- [x] 1.2.3 Deploy Redis container
- [x] 1.2.4 Configure Redis persistence

### 1.3 Nginx Configuration

- [x] 1.3.1 Install and configure Nginx
- [x] 1.3.2 Setup SSL certificate (Let's Encrypt)
- [x] 1.3.3 Configure reverse proxy rules
- [x] 1.3.4 Configure WebSocket proxy
- [x] 1.3.5 Setup static file serving

### 1.4 Docker Compose Orchestration

- [x] 1.4.1 Create docker-compose.yml
- [x] 1.4.2 Define services: backend, frontend, postgres, redis, nginx
- [x] 1.4.3 Configure network isolation
- [x] 1.4.4 Setup volume mounts for logs and backups

---

## 2. Phase 2: Core Data Layer

### 2.1 Database Schema

- [x] 2.1.1 Create news table with all columns
- [x] 2.1.2 Create reports table
- [x] 2.1.3 Create tasks table
- [x] 2.1.4 Create logs table
- [x] 2.1.5 Create tools table
- [x] 2.1.6 Create indexes on title, source, lang, category
- [x] 2.1.7 Create composite indexes

### 2.2 Data Access Layer

- [x] 2.2.1 Setup TypeORM/Prisma connection
- [x] 2.2.2 Create News repository
- [x] 2.2.3 Create Report repository
- [x] 2.2.4 Create Task repository
- [x] 2.2.5 Create Log repository
- [x] 2.2.6 Create Tool repository

### 2.3 News Storage Implementation

- [x] 2.3.1 Implement MD5 deduplication
- [x] 2.3.2 Implement Jaccard clustering (0.5 threshold)
- [x] 2.3.3 Implement incremental update logic
- [x] 2.3.4 Implement bilingual storage (EN/ZH)
- [x] 2.3.5 Implement auto-translation on insert
- [x] 2.3.6 Implement category assignment

### 2.4 Cleanup Tasks

- [x] 2.4.1 Create news cleanup task (2 months retention)
- [x] 2.4.2 Create report cleanup task (1 month retention)
- [x] 2.4.3 Schedule cleanup via Cron

### 2.5 REST API Implementation

- [x] 2.5.1 Implement GET /api/news (list with pagination)
- [x] 2.5.2 Implement GET /api/news/:id
- [x] 2.5.3 Implement GET /api/news/search
- [x] 2.5.4 Implement GET /api/reports
- [x] 2.5.5 Implement GET /api/reports/:id
- [x] 2.5.6 Implement GET /api/tasks
- [x] 2.5.7 Implement GET /api/tasks/:id
- [x] 2.5.8 Implement POST /api/tasks/trigger
- [x] 2.5.9 Implement GET /api/tools
- [x] 2.5.10 Implement POST /api/tools
- [x] 2.5.11 Implement PUT /api/tools/:id
- [x] 2.5.12 Implement DELETE /api/tools/:id

---

## 3. Phase 3: Agent Framework

### 3.1 Core Agent System

- [x] 3.1.1 Create Agent base class
- [x] 3.1.2 Implement tool registry in database
- [x] 3.1.3 Implement tool execution engine
- [x] 3.1.4 Implement message queue system

### 3.2 Sub-Agent Implementation

- [x] 3.2.1 Implement News Collector Agent
- [x] 3.2.2 Implement Data Analysis Agent
- [x] 3.2.3 Implement Information Query Agent
- [x] 3.2.4 Implement Deep Thinking Agent
- [x] 3.2.5 Implement Report Generation Agent
- [x] 3.2.6 Implement Fact Checking Agent

### 3.3 Task Queue (Bull)

- [x] 3.3.1 Setup Bull queue with Redis
- [x] 3.3.2 Create task processors
- [x] 3.3.3 Implement progress reporting
- [x] 3.3.4 Configure concurrency limits

### 3.4 Cron Scheduler

- [x] 3.4.1 Setup node-cron
- [x] 3.4.2 Configure RSS collection schedule (every 30 min)
- [x] 3.4.3 Configure translation schedule (every 15 min)
- [x] 3.4.4 Configure report generation (daily 6 AM)
- [x] 3.4.5 Configure cleanup (daily 3 AM)

### 3.5 WebSocket Server

- [x] 3.5.1 Setup WebSocket server
- [x] 3.5.2 Implement message router
- [x] 3.5.3 Implement agent status push
- [x] 3.5.4 Implement task progress push
- [x] 3.5.5 Implement log streaming
- [x] 3.5.6 Implement news update push
- [x] 3.5.7 Implement heartbeat mechanism
- [x] 3.5.8 Setup Redis adapter for multi-instance

---

## 4. Phase 4: Frontend Transformation

### 4.1 Zustand Integration

- [x] 4.1.1 Install Zustand
- [x] 4.1.2 Create news store
- [x] 4.1.3 Create report store
- [x] 4.1.4 Create task store
- [x] 4.1.5 Create UI store
- [x] 4.1.6 Refactor components to use Zustand - **NewsPanelModern example created**

### 4.2 WebSocket Client

- [x] 4.2.1 Create WebSocket hook
- [x] 4.2.2 Implement auto-reconnect
- [x] 4.2.3 Implement message handler
- [x] 4.2.4 Connect to Zustand stores

### 4.3 UI Layout Implementation

> **Note**: These require significant refactoring of App.ts. See docs/tech/UI-REFACTORING-GUIDE.md for detailed plan.

- [x] 4.3.1 Restructure layout: news panel (left) - **Layout components created**
- [x] 4.3.2 Restructure layout: chat window (center) - **AppLayout component**
- [x] 4.3.3 Restructure layout: report panel (top right) - **PanelContainer component**
- [x] 4.3.4 Restructure layout: map below header - **AppLayout component**
- [x] 4.3.5 Implement responsive design - **useBreakpoint hook created**

### 4.4 Agent Control Panel

- [x] 4.4.1 Create agent status display
- [x] 4.4.2 Create task list view
- [x] 4.4.3 Create manual trigger buttons
- [x] 4.4.4 Implement real-time log viewer
- [x] 4.4.5 Implement progress visualization

### 4.5 Component Updates

- [x] 4.5.1 Update NewsPanel to use new API - **NewsPanelModern created**
- [x] 4.5.2 Update MarketPanel to use new API - **Added api-client integration**
- [x] 4.5.3 Update InsightsPanel to use new API - **Added api-client integration**
- [x] 4.5.4 Add bilingual toggle to relevant components

### 4.6 UI Layout Refactoring (2026-03-13)

- [x] 4.6.1 Create Zustand stores (newsStore, chatStore, reportStore, uiStore)
- [x] 4.6.2 Create layout components (LeftSidebar, ChatWindow, ReportPanel, AppLayout)
- [x] 4.6.3 Implement three-column layout
- [x] 4.6.4 Header: Keep tech/world toggle, remove x.com and GitHub links
- [x] 4.6.5 Merge AI Chat and Live News into unified panel with category tabs
- [x] 4.6.6 Reports panel moved to right sidebar with generate buttons

### 4.7 Layout Fixes (2026-03-13)

- [x] 4.7.1 Remove orange box (settings/sources buttons) from header
- [x] 4.7.2 Add settings/sources buttons to ReportPanel header
- [x] 4.7.3 Add AI chat below reports in right sidebar (reports top, chat bottom)
- [x] 4.7.4 Fix map layer tabs to be inside map area (position: relative on mapContainer)

---

## 5. Phase 5: Polish & Operations

### 5.1 Logging System

- [x] 5.1.1 Integrate Pino logger
- [x] 5.1.2 Configure log levels
- [x] 5.1.3 Setup file output
- [x] 5.1.4 Configure Docker stdout
- [x] 5.1.5 Implement log rotation

### 5.2 Error Handling

- [x] 5.2.1 Implement retry decorator
- [x] 5.2.2 Configure task-specific retry
- [x] 5.2.3 Implement exponential backoff
- [x] 5.2.4 Add error boundary in frontend
- [x] 5.2.5 Implement graceful degradation

### 5.3 Backup System

- [x] 5.3.1 Create backup script
- [x] 5.3.2 Configure daily schedule
- [x] 5.3.3 Setup cloud upload (S3/OSS)
- [x] 5.3.4 Implement backup verification
- [x] 5.3.5 Configure 7-day retention
- [x] 5.3.6 Test restore procedure - **Script: scripts/verify-deployment.sh**

### 5.4 Security Hardening

- [x] 5.4.1 Verify Docker network isolation - **Included in verify script**
- [x] 5.4.2 Test internal API protection - **Included in verify script**
- [x] 5.4.3 Configure security headers
- [x] 5.4.4 Setup SSL auto-renewal
- [x] 5.4.5 Review Nginx configuration

### 5.5 Monitoring (Future)

- [x] 5.5.1 Setup health check endpoint
- [x] 5.5.2 Configure basic alerting
- [x] 5.5.3 Add metrics collection

### 5.6 CI/CD (Future)

- [x] 5.6.1 Create GitHub Actions workflow
- [x] 5.6.2 Build Docker image on push
- [x] 5.6.3 Add deployment automation

---

## 6. Data Migration

### 6.1 RSS Data Migration

- [x] 6.1.1 Export existing RSS data from Redis
- [x] 6.1.2 Transform data to new schema
- [x] 6.1.3 Import to PostgreSQL
- [x] 6.1.4 Verify data integrity

### 6.2 Historical Data

- [x] 6.2.1 Decide on historical data migration
- [x] 6.2.2 Migrate if needed
- [x] 6.2.3 Update retention policies
