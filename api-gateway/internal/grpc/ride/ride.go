package grpcRideClient

import (
	"log"

	pb "github.com/ride-app/shared/pkg/ride"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var RideClient pb.RideServiceClient

func InitRideClient() {

	conn, err := grpc.NewClient(
		"localhost:5501",
		grpc.WithTransportCredentials(
			insecure.NewCredentials(),
		),
	)

	if err != nil {
		log.Fatalf(
			"failed to connect Ride Service: %v",
			err,
		)
	}

	RideClient = pb.NewRideServiceClient(conn)

	log.Println(
		"connected to Ride Service",
	)
}
