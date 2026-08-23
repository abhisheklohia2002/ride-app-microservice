package matching

import (
	"context"

	pb "github.com/ride-app/shared/pkg/matching"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Client interface {
	FindDriver(
		ctx context.Context,
		req *pb.FindDriverRequest,
	) (*pb.FindDriverResponse, error)
}

type clientImpl struct {
	client pb.MatchingServiceClient
}

func NewClient(
	address string,
) (Client, error) {

	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(
			insecure.NewCredentials(),
		),
	)

	if err != nil {
		return nil, err
	}

	return &clientImpl{
		client: pb.NewMatchingServiceClient(conn),
	}, nil
}

func (c *clientImpl) FindDriver(
	ctx context.Context,
	req *pb.FindDriverRequest,
) (*pb.FindDriverResponse, error) {

	return c.client.FindDriver(ctx, req)
}
