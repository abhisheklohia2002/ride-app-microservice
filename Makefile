proto-run-driver:
	protoc --go_out=. --go-grpc_out=. proto/driver/driver.proto

proto-run-ride:
	protoc --go_out=. --go-grpc_out=. proto/ride/ride.proto

proto-run-matching:
	protoc --go_out=. --go-grpc_out=. proto/matching/matching.proto