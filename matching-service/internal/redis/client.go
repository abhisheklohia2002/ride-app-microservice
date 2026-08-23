package redis

import (
	"context"

	goredis "github.com/redis/go-redis/v9"
)

type Client struct {
	RDB *goredis.Client
}

func NewClient(url string) (*Client, error) {

	options, err := goredis.ParseURL(url)
	if err != nil {
		return nil, err
	}

	rdb := goredis.NewClient(options)

	ctx := context.Background()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &Client{
		RDB: rdb,
	}, nil
}

func (c *Client) Close() error {
	return c.RDB.Close()
}
