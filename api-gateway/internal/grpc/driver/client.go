package grpcDriverClient

import (
	"log"

	pb "github.com/ride-app/shared/pkg/driver"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var DriverClient pb.DriverServiceClient

func InitDriverClient() *grpc.ClientConn {
	address := "localhost:5500"

	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(
			insecure.NewCredentials(),
		),
	)
	if err != nil {
		log.Fatalf("failed to create Driver Service client: %v", err)
	}

	DriverClient = pb.NewDriverServiceClient(conn)

	log.Printf("Driver Service gRPC client initialized: %s", address)

	return conn
}
