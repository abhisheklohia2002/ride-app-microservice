package rabbitmq

import (
	"github.com/rabbitmq/amqp091-go"
)

const DriverExchange = "driver.events"

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
		_ = conn.Close()
		return nil, err
	}

	err = channel.ExchangeDeclare(
		DriverExchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		_ = channel.Close()
		_ = conn.Close()
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
		DriverExchange,
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
