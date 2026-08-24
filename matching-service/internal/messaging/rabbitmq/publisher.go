package rabbitmq

import (
	"context"
	"encoding/json"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Publisher struct {
	channel *amqp.Channel
}

func NewPublisher(
	conn *amqp.Connection,
) (*Publisher, error) {

	channel, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	return &Publisher{
		channel: channel,
	}, nil
}

func (p *Publisher) Publish(
	ctx context.Context,
	queue string,
	payload any,
) error {

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return p.channel.PublishWithContext(
		ctx,
		"",
		queue,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

func (p *Publisher) Close() error {
	return p.channel.Close()
}
