# Phase 1 Security and Local Setup

## Environment configuration

Auth, Complaint, Assignment, and Notification services accept these environment
overrides:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5433/resolvenow_db'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = '<your-local-postgres-password>'
$env:JWT_SECRET = '<base64-encoded-private-key>'
$env:JWT_EXPIRATION = '86400000'
```

`JWT_SECRET` must be the same for Auth Service and API Gateway and decode to at
least 256 bits for HS256. Generate a key in PowerShell with:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Set these variables in the environment used to start each service. The committed
property defaults remain for current local development compatibility only; they
are not appropriate for deployment. Override them and rotate the previously
committed database credential and JWT key before exposing any service. Do not
commit real environment files or put secrets in frontend configuration.

The frontend continues to use the Gateway at `http://localhost:8080/api`; no
database or JWT secret is used by the frontend.

## Direct service access

Complaint, Assignment, and Notification currently have no service-level
authentication. Their HTTP servers bind on the host interface by default, so a
client that can reach ports `8082`, `8083`, or `8084` can bypass Gateway JWT
validation. The same concern applies to direct access to Auth on `8081`.

For deployment, apply host firewall rules or private-network security groups:

- Expose `8080` only to intended clients.
- Permit `8081` through `8084` only from the Gateway and required internal
  callers. Gateway needs access to each routed service; Complaint needs access
  to Assignment; Assignment needs access to Notification.
- Permit Eureka traffic on `8761` from the Gateway and all registered services,
  but do not expose the Eureka dashboard publicly.
- Keep direct service ports off public interfaces. Do not bind them to loopback
  without also configuring Eureka to advertise a reachable internal address;
  doing so can break Gateway routing and service-to-service calls.

This Phase 1 change deliberately does not add separate JWT handling to every
domain service or alter Eureka/service routing. Network-level restrictions are
the lowest-risk immediate control. A later phase can add authenticated internal
service calls or mTLS if deployment requirements demand defense in depth.