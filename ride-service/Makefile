.PHONY: run-dev run-test

run-dev:
	@ENV_FILE=.env go run ./cmd/server/

run-test:
	@ENV_FILE=.env.test go run ./cmd/server/

proto-run-driver:
	protoc --go_out=. --go-grpc_out=. proto/driver/driver.proto