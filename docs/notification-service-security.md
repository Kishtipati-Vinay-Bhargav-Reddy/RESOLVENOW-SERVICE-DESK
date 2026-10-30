# Notification Service Security

Complaint Service and Assignment Service use Eureka-based HTTP calls and send the `X-Internal-Service-Token` header for their respective internal POST operations. Configure the same high-entropy `INTERNAL_SERVICE_TOKEN` value in Complaint Service, Assignment Service, and Notification Service. The token has no default; internal writes fail closed when it is missing or incorrect.

Browser requests must use the existing Auth Service JWT. The internal token is not exposed to the frontend. Notification reads and read-state changes derive the recipient exclusively from the JWT `userId` claim.

The shared token authenticates possession of a secret, but it is not per-service identity or mutual TLS. Keep service traffic on a trusted network, use TLS between services where available, restrict who can read the environment secret, and rotate it across all three services together.