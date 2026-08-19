proto-run-driver:
	protoc --go_out=. --go-grpc_out=. proto/driver/driver.proto