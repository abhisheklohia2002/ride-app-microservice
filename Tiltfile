# Local development environment for the ride application.
# Go services run on the host so their existing Makefile development commands
# load each service's own .env file. Docker Compose owns infrastructure only.
# These are the existing infrastructure definitions; Tilt does not modify them.

docker_compose('ride-service/docker-compose.yaml')
docker_compose('ride-backend/docker-compose.yaml')
docker_compose('matching-service/docker-compose.yaml')

# Docker Compose owns infrastructure. Tilt does not directly observe Compose
# health checks, so the adjacent `*-ready` resources poll each service's
# native health command as readiness barriers.
dc_resource('rideservice-db')
dc_resource('postgres')
dc_resource('redis')
dc_resource('rabbitmq')

local_resource(
    'postgres-ready',
    cmd="sh -c 'until docker compose --project-directory ride-service -p ride-service -f ride-service/docker-compose.yaml exec -T rideservice-db pg_isready -U postgres -d ride_service >/dev/null 2>&1; do sleep 1; done'",
    resource_deps=['rideservice-db'],
)

local_resource(
    'driver-postgres-ready',
    cmd="sh -c 'until docker compose --project-directory ride-backend -p ride-backend -f ride-backend/docker-compose.yaml exec -T postgres pg_isready -U postgres -d ride-app >/dev/null 2>&1; do sleep 1; done'",
    resource_deps=['postgres'],
)

local_resource(
    'redis-ready',
    cmd="sh -c 'until docker compose --project-directory matching-service -p matching-service -f matching-service/docker-compose.yaml exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do sleep 1; done'",
    resource_deps=['redis'],
)

local_resource(
    'rabbitmq-ready',
    cmd="sh -c \"until docker compose --project-directory ride-service -p ride-service -f ride-service/docker-compose.yaml exec -T rabbitmq rabbitmq-diagnostics listeners 2>/dev/null | grep -q 'port: 5672, protocol: amqp'; do sleep 1; done\"",
    resource_deps=['rabbitmq'],
)

# `serve_cmd` keeps each process independently controllable from the Tilt UI.
# `deps` causes Tilt to restart only the service whose source changed.
local_resource(
    'ride-service',
    serve_cmd='make run-dev',
    serve_dir='ride-service',
    serve_env={'ENV_FILE': '.env.test'},
    deps=['ride-service', 'shared', 'proto'],
    resource_deps=['rideservice-db', 'postgres-ready', 'rabbitmq', 'rabbitmq-ready'],
    readiness_probe=probe(
        tcp_socket=tcp_socket_action(port=5501),
        initial_delay_secs=2,
        period_secs=2,
    ),
)

local_resource(
    'ride-driver-service',
    serve_cmd='make run-dev',
    serve_dir='ride-backend',
    serve_env={'ENV_FILE': '.env.test'},
    deps=['ride-backend', 'shared', 'proto'],
    resource_deps=[
        'ride-service',
        'postgres',
        'driver-postgres-ready',
        'rabbitmq',
        'rabbitmq-ready',
    ],
    readiness_probe=probe(
        http_get=http_get_action(port=8081, path='/health'),
        initial_delay_secs=2,
        period_secs=2,
    ),
)

local_resource(
    'ride-matching-service',
    serve_cmd='make run-dev',
    serve_dir='matching-service',
    serve_env={'ENV_FILE': '.env.test'},
    deps=['matching-service', 'shared', 'proto'],
    resource_deps=[
        'ride-driver-service',
        'rideservice-db',
        'postgres-ready',
        'redis',
        'redis-ready',
        'rabbitmq',
        'rabbitmq-ready',
    ],
    readiness_probe=probe(
        http_get=http_get_action(port=8085, path='/health-matching-service'),
        initial_delay_secs=2,
        period_secs=2,
    ),
)

local_resource(
    'api-gateway',
    # The gateway's existing Makefile exposes its server command as run-test.
    serve_cmd='make run-test',
    serve_dir='api-gateway',
    deps=['api-gateway', 'shared', 'proto'],
    resource_deps=[
        'ride-service',
        'ride-driver-service',
        'ride-matching-service',
    ],
    readiness_probe=probe(
        tcp_socket=tcp_socket_action(port=8080),
        initial_delay_secs=2,
        period_secs=2,
    ),
)

local_resource(
    'frontend-deps',
    cmd='npm ci',
    dir='client',
    deps=['client/package.json', 'client/package-lock.json'],
)

local_resource(
    'frontend',
    serve_cmd='npm run dev -- --host 0.0.0.0',
    serve_dir='client',
    deps=[
        'client/src',
        'client/public',
        'client/index.html',
        'client/vite.config.ts',
        'client/tsconfig.json',
        'client/tsconfig.app.json',
        'client/tsconfig.node.json',
        'client/package.json',
        'client/package-lock.json',
    ],
    resource_deps=['api-gateway', 'frontend-deps'],
    readiness_probe=probe(
        http_get=http_get_action(port=5173, path='/'),
        initial_delay_secs=2,
        period_secs=2,
    ),
)
