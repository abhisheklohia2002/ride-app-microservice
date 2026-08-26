package consumers

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"

	"github.com/ride-app/ride-matching-service/internal/events"
	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/services"
	matchingWebSocket "github.com/ride-app/ride-matching-service/internal/websocket"
)

type RideConsumer struct {
	rabbitConsumer   *rabbitmq.Consumer
	matchingService  *services.MatchingService
	passengerHub     *matchingWebSocket.Hub
	activeRideStore  *services.ActiveRideStore
	pendingRideStore *services.PendingRideStore
}

func NewRideConsumer(
	rabbitConsumer *rabbitmq.Consumer,
	matchingService *services.MatchingService,
	passengerHub *matchingWebSocket.Hub,
	activeRideStore *services.ActiveRideStore,
	pendingRideStore *services.PendingRideStore,
) *RideConsumer {
	return &RideConsumer{
		rabbitConsumer:   rabbitConsumer,
		matchingService:  matchingService,
		passengerHub:     passengerHub,
		activeRideStore:  activeRideStore,
		pendingRideStore: pendingRideStore,
	}
}

func (c *RideConsumer) Start(
	ctx context.Context,
) error {
	queueName := "matching.ride.events"

	messages, err := c.rabbitConsumer.Consume(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_SEARCHING",
	)
	if err != nil {
		return err
	}

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_ASSIGNED",
	); err != nil {
		return err
	}

	log.Println("ride consumer started")

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
						"failed to acknowledge ride event: %v",
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
	switch message.RoutingKey {
	case "RIDE_SEARCHING":
		return c.handleRideSearching(
			ctx,
			message,
		)

	case "RIDE_ASSIGNED":
		return c.handleRideAssigned(
			message,
		)

	default:
		log.Printf(
			"unknown ride event routing key=%s",
			message.RoutingKey,
		)

		return nil
	}
}

func (c *RideConsumer) handleRideSearching(
	ctx context.Context,
	message amqp091.Delivery,
) error {
	var event events.RideSearchingEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	log.Printf(
		"RECEIVED RIDE_SEARCHING ride=%d passenger=%d",
		event.RideID,
		event.PassengerID,
	)

	log.Printf(
		"ride searching received ride=%d pickup=(%f,%f)",
		event.RideID,
		event.PickupLatitude,
		event.PickupLongitude,
	)

	c.matchingService.AddPendingRide(
		event,
	)

	log.Printf(
		"PENDING RIDE STORED ride=%d",
		event.RideID,
	)

	log.Printf(
		"TRY MATCH RIDE ride=%d",
		event.RideID,
	)

	if err := c.matchingService.TryMatchRide(
		ctx,
		event,
	); err != nil {
		return err
	}

	return nil
}

func (c *RideConsumer) handleRideAssigned(
	message amqp091.Delivery,
) error {
	var event events.RideAssignedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	log.Printf(
		"ride assigned ride=%d passenger=%d driver=%d driverName=%s",
		event.RideID,
		event.PassengerID,
		event.DriverID,
		event.DriverName,
	)

	c.activeRideStore.Set(
		event.RideID,
		event.PassengerID,
		event.DriverID,
	)

	c.pendingRideStore.Remove(
		event.RideID,
	)

	payload := map[string]any{
		"type": "RIDE_ASSIGNED",
		"data": event,
	}

	if err := c.passengerHub.SendToPassenger(
		event.PassengerID,
		payload,
	); err != nil {
		return err
	}

	log.Printf(
		"ride assigned event sent to passenger=%d",
		event.PassengerID,
	)

	return nil
}
