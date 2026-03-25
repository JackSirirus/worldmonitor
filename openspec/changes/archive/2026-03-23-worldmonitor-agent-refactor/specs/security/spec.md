# Security Specification

## ADDED Requirements

### Requirement: Nginx Reverse Proxy
The system SHALL use Nginx as reverse proxy.

#### Scenario: Request routing
- **WHEN** user makes HTTP request
- **THEN** request goes through Nginx
- **AND** Nginx forwards to appropriate backend service

#### Scenario: Static file serving
- **WHEN** request is for static files
- **THEN** Nginx serves files directly
- **AND** reduces backend load

---

### Requirement: Docker Network Isolation
The system SHALL isolate services in Docker network.

#### Scenario: Internal network
- **WHEN** Docker containers start
- **THEN** they use internal network
- **AND** services are not directly accessible from outside

#### Scenario: Exposed ports
- **WHEN** services need to be accessed
- **THEN** only Nginx is exposed to external network
- **AND** backend services are internal only

---

### Requirement: WebSocket Upgrade
The system SHALL support WebSocket through Nginx.

#### Scenario: WebSocket proxy
- **WHEN** WebSocket upgrade request is received
- **THEN** Nginx proxies the connection
- **AND** maintains the upgraded connection

---

### Requirement: API Network Protection
The system SHALL protect APIs from direct external access.

#### Scenario: Internal API access
- **WHEN** request comes from Nginx
- **THEN** request is forwarded to backend

#### Scenario: Direct external access attempt
- **WHEN** external request targets backend directly
- **THEN** request is rejected (not routed)
- **AND** only Nginx port is accessible

---

### Requirement: HTTPS Support
The system SHALL support HTTPS connections.

#### Scenario: HTTPS termination
- **WHEN** HTTPS request is received
- **THEN** Nginx handles SSL termination
- **AND** forwards plain HTTP to backend

#### Scenario: Certificate management
- **WHEN** SSL certificate needs renewal
- **THEN** Let's Encrypt auto-renewal handles it
- **AND** no manual intervention needed

---

### Requirement: Security Headers
The system SHALL set appropriate security headers.

#### Scenario: Security headers
- **WHEN** response is sent
- **THEN** security headers are included
- **AND** includes: X-Frame-Options, X-Content-Type-Options, etc.

---

### Requirement: Internal API Protection
The system SHALL protect internal APIs.

#### Scenario: No external API access
- **WHEN** direct external request targets API
- **THEN** request is blocked by network isolation
- **AND** only Nginx can route to APIs
