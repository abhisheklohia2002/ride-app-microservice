# Ride application local development

## Tilt development environment

Install [Tilt](https://docs.tilt.dev/install.html) and Docker Desktop (or Docker
Engine with the Compose plugin). Tilt installs the frontend dependencies from
the committed lockfile on its first run.

The Go services use their existing Makefile server commands. Tilt points them
at each service's existing `.env.test` file by default; replace that
`serve_env` value in the Tiltfile with `.env` if you maintain local `.env`
files instead.
For host-run services, set `RABBITMQ_URL` to use `localhost:5677` and set the
matching service's `REDIS_ADDR` to `localhost:6370`. Keep the existing database
ports: `5809` for `ride-service`/matching and `5808` for `ride-driver-service`.

Start the complete environment from the repository root:

```sh
tilt up
```

Tilt starts Docker infrastructure first (PostgreSQL, Redis, and RabbitMQ), then
`ride-service`, `ride-driver-service`, `ride-matching-service`, `api-gateway`,
and finally the React frontend. Resource dependencies and Compose health checks
control the startup sequence; no fixed delays are used. RabbitMQ's management UI is at
<http://localhost:15672>.

Open the Tilt UI at <http://localhost:10350>. Select a resource there to view
its individual logs, status, and readiness checks. Restart or stop one service
with the controls in that resource's UI panel; from another terminal, you can
also restart it with:

```sh
tilt trigger ride-matching-service
```

Stop the complete environment with `tilt down` (or press `Ctrl-C` in the
terminal running `tilt up`, then run `tilt down` to remove the Docker
infrastructure).
