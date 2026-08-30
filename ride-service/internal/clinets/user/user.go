package user

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type Client interface {
	GetUserByID(
		ctx context.Context,
		userID uint64,
	) (*User, error)
}

type User struct {
	ID       uint64 `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

type clientImpl struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(
	baseURL string,
) Client {
	return &clientImpl{
		baseURL:    baseURL,
		httpClient: &http.Client{},
	}
}

func (c *clientImpl) GetUserByID(
	ctx context.Context,
	userID uint64,
) (*User, error) {

	url := fmt.Sprintf(
		"%s/api/users/%d",
		c.baseURL,
		userID,
	)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		url,
		nil,
	)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"user service returned status: %d",
			resp.StatusCode,
		)
	}

	var response struct {
		Data User `json:"data"`
	}

	if err := json.NewDecoder(
		resp.Body,
	).Decode(&response); err != nil {
		return nil, err
	}

	return &response.Data, nil
}
