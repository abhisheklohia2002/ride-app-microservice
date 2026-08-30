package rabbitmq

import (
	"github.com/rabbitmq/amqp091-go"
)

const RideExchange = "ride.events"

type Consumer struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
}

func NewConsumer(
	url string,
) (*Consumer, error) {

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
		RideExchange,
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

	return &Consumer{
		conn:    conn,
		channel: channel,
	}, nil
}

func (c *Consumer) Consume(
	queueName string,
	routingKey string,
) (<-chan amqp091.Delivery, error) {

	queue, err := c.channel.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		return nil, err
	}

	err = c.channel.QueueBind(
		queue.Name,
		routingKey,
		RideExchange,
		false,
		nil,
	)

	if err != nil {
		return nil, err
	}

	return c.channel.Consume(
		queue.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
}

func (c *Consumer) Close() {
	if c.channel != nil {
		_ = c.channel.Close()
	}

	if c.conn != nil {
		_ = c.conn.Close()
	}
}

func (c *Consumer) Bind(
	queueName string,
	routingKey string,
) error {
	return c.channel.QueueBind(
		queueName,
		routingKey,
		RideExchange,
		false,
		nil,
	)
}
