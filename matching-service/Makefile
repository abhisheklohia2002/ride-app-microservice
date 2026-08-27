.PHONY: run-dev run-test

run-dev:
	@ENV_FILE=$${ENV_FILE:-.env} go run ./cmd/server/

run-test:
	@ENV_FILE=.env.test go run ./cmd/server/
