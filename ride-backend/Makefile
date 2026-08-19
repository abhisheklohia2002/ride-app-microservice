.PHONY: run-dev run-test

run-dev:
	@ENV_FILE=.env go run ./cmd/api

run-test:
	@ENV_FILE=.env.test go run ./cmd/api

proto-run-driver:
	protoc --go_out=. --go-grpc_out=. proto/driver/driver.proto