module github.com/ride-api-gateway

go 1.26.5

require (
	github.com/golang-jwt/jwt/v5 v5.3.1
	google.golang.org/grpc v1.83.1
)

require (
	github.com/ride-app/shared v0.0.0
	golang.org/x/net v0.55.0 // indirect
	golang.org/x/sys v0.45.0 // indirect
	golang.org/x/text v0.37.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260526163538-3dc84a4a5aaa // indirect
	google.golang.org/protobuf v1.36.12 // indirect
)

replace github.com/ride-app/shared => ../shared
