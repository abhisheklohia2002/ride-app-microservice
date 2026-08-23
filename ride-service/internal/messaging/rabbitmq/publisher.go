package rabbitmq

import (
	"github.com/rabbitmq/amqp091-go"
)

const (
	RideExchange = "ride.events"
)

type Publisher struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
}

func NewPublisher(url string) (*Publisher, error) {

	conn, err := amqp091.Dial(url)
	if err != nil {
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	err = channel.ExchangeDeclare(
		RideExchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		channel.Close()
		conn.Close()
		return nil, err
	}

	return &Publisher{
		conn:    conn,
		channel: channel,
	}, nil
}

func (p *Publisher) Publish(
	routingKey string,
	body []byte,
) error {

	return p.channel.Publish(
		RideExchange,
		routingKey,
		false,
		false,
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

func (p *Publisher) Close() {

	if p.channel != nil {
		_ = p.channel.Close()
	}

	if p.conn != nil {
		_ = p.conn.Close()
	}
}
