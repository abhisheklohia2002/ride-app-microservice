package consumers

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"

	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/services"
	// "github.com/ride-app/shared/messaging/rabbitmq"
)

type DriverLocationUpdatedEvent struct {
	DriverID  uint64  `json:"driver_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type DriverConsumer struct {
	rabbitConsumer  *rabbitmq.Consumer
	matchingService *services.MatchingService
}

func NewDriverConsumer(
	rabbitConsumer *rabbitmq.Consumer,
	matchingService *services.MatchingService,
) *DriverConsumer {
	return &DriverConsumer{
		rabbitConsumer:  rabbitConsumer,
		matchingService: matchingService,
	}
}

func (c *DriverConsumer) Start(
	ctx context.Context,
) error {

	messages, err := c.rabbitConsumer.Consume(
		"matching.driver.location",
		"DRIVER_LOCATION_UPDATED",
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
						"failed to process driver location: %v",
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
						"failed to acknowledge driver location: %v",
						err,
					)
				}
			}
		}

	}()

	return nil
}

func (c *DriverConsumer) handleMessage(
	ctx context.Context,
	message amqp091.Delivery,
) error {

	var event DriverLocationUpdatedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	if event.DriverID == 0 {
		return nil
	}

	if err := c.matchingService.UpdateDriverLocation(
		ctx,
		event.DriverID,
		event.Latitude,
		event.Longitude,
	); err != nil {
		return err
	}

	log.Printf(
		"driver location updated: driver=%d lat=%f lng=%f",
		event.DriverID,
		event.Latitude,
		event.Longitude,
	)

	return nil
}
