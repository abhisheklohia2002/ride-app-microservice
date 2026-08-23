package rabbitmq

import "github.com/rabbitmq/amqp091-go"

func Setup(channel *amqp091.Channel) error {

	err := channel.ExchangeDeclare(
		"ride.events",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		return err
	}

	return nil
}
