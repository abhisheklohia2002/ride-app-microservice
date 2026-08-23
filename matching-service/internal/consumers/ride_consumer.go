package consumers

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"

	"github.com/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-matching-service/internal/services"
)

type RideConsumer struct {
	rabbitConsumer  *rabbitmq.Consumer
	matchingService *services.MatchingService
}

func NewRideConsumer(
	rabbitConsumer *rabbitmq.Consumer,
	matchingService *services.MatchingService,
) *RideConsumer {
	return &RideConsumer{
		rabbitConsumer:  rabbitConsumer,
		matchingService: matchingService,
	}
}

func (c *RideConsumer) Start(
	ctx context.Context,
) error {

	messages, err := c.rabbitConsumer.Consume(
		"matching.ride.searching",
		"RIDE_SEARCHING",
	)
	if err != nil {
		return err
	}

	go func() {

		for {
			select {

			case <-ctx.Done():
				return

			case message, ok := <-messages:

				if !ok {
					return
				}

				if err := c.handleMessage(
					ctx,
					message,
				); err != nil {

					log.Printf(
						"failed to process ride event: %v",
						err,
					)

					_ = message.Nack(
						false,
						true,
					)

					continue
				}

				if err := message.Ack(false); err != nil {
					log.Printf(
						"failed to acknowledge message: %v",
						err,
					)
				}
			}
		}
	}()

	return nil
}

func (c *RideConsumer) handleMessage(
	ctx context.Context,
	message amqp091.Delivery,
) error {

	var event RideSearchingEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	drivers, err := c.matchingService.FindNearbyDrivers(
		ctx,
		event.PickupLatitude,
		event.PickupLongitude,
		5,
	)
	if err != nil {
		return err
	}

	log.Printf(
		"ride=%d nearby drivers=%v",
		event.RideID,
		drivers,
	)

	return nil
}
