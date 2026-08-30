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
	hub              *matchingWebSocket.Hub
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

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_CANCELLED",
	); err != nil {
		return err
	}

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_REJECTED",
	); err != nil {
		return err
	}

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_ACCEPTED",
	); err != nil {
		return err
	}

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_TAKEN",
	); err != nil {
		return err
	}

	if err := c.rabbitConsumer.Bind(
		queueName,
		rabbitmq.RideExchange,
		"RIDE_COMPLETED",
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
			ctx,
			message,
		)
	case "RIDE_COMPLETED":
		return c.handleRideCompleted(ctx, message)

	case "RIDE_CANCELLED":
		return c.handleRideCancelled(ctx, message)

	case "RIDE_REJECTED":
		return c.handleRideRejected(
			ctx,
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
	ctx context.Context,
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
		"ride assigned ride=%d passenger=%d winner=%d",
		event.RideID,
		event.PassengerID,
		event.DriverID,
	)

	ride, ok := c.pendingRideStore.Get(
		event.RideID,
	)

	if ok {
		for driverID := range ride.OfferedDrivers {

			// Winner should NOT receive RIDE_TAKEN.
			if driverID == event.DriverID {
				continue
			}

			takenEvent := events.RideTakenEvent{
				RideID:          event.RideID,
				DriverID:        driverID,
				WinningDriverID: event.DriverID,
			}

			if err := c.matchingService.PublishRideTaken(
				ctx,
				takenEvent,
			); err != nil {
				return err
			}

			log.Printf(
				"ride taken published ride=%d loser=%d winner=%d",
				event.RideID,
				driverID,
				event.DriverID,
			)
		}
	}

	c.pendingRideStore.Remove(
		event.RideID,
	)

	c.activeRideStore.Set(
		event.RideID,
		uint64(event.PassengerID),
		event.DriverID,
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

	return nil
}

func (c *RideConsumer) handleRideCancelled(
	ctx context.Context,
	message amqp091.Delivery,
) error {
	var event events.RideCancelledEvent
	if err := json.Unmarshal(message.Body, &event); err != nil {
		return err
	}

	c.pendingRideStore.Remove(event.RideID)

	if event.DriverID == nil {
		if driverID, ok := c.matchingService.OfferedDriver(event.RideID); ok {
			event.DriverID = &driverID
		}
	}
	c.matchingService.RemoveOfferedRide(event.RideID)

	if event.DriverID != nil {
		c.activeRideStore.RemoveByDriver(*event.DriverID)
		if err := c.matchingService.PublishCancellationForDriver(ctx, event); err != nil {
			return err
		}
	}

	payload := map[string]any{
		"type": "RIDE_CANCELLED",
		"data": event,
	}

	return c.passengerHub.SendToPassenger(event.PassengerID, payload)
}

func (c *RideConsumer) handleRideRejected(
	ctx context.Context,
	message amqp091.Delivery,
) error {
	var event events.RideRejectedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	log.Printf(
		"RIDE_REJECTED ride=%d driver=%d",
		event.RideID,
		event.DriverID,
	)

	ride, ok := c.pendingRideStore.Get(
		event.RideID,
	)

	if !ok {
		log.Printf(
			"pending ride not found ride=%d",
			event.RideID,
		)

		return nil
	}

	if ride.RejectedDrivers == nil {
		ride.RejectedDrivers =
			make(map[uint64]bool)
	}

	ride.RejectedDrivers[event.DriverID] = true

	c.pendingRideStore.Set(ride)

	log.Printf(
		"driver rejected ride=%d driver=%d",
		event.RideID,
		event.DriverID,
	)

	return c.matchingService.TryMatchPendingRide(
		ctx,
		ride,
	)
}

func (c *RideConsumer) handleRideCompleted(
	ctx context.Context,
	message amqp091.Delivery,
) error {

	var event events.RideCompletedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	log.Printf(
		"RIDE_COMPLETED received ride=%d passenger=%d driver=%d",
		event.RideID,
		event.PassengerID,
		event.DriverID,
	)

	payload := map[string]any{
		"type": "RIDE_COMPLETED",
		"data": event,
	}

	if err := c.passengerHub.SendToPassenger(
		event.PassengerID,
		payload,
	); err != nil {
		return err
	}

	log.Printf(
		"RIDE_COMPLETED sent to passenger=%d",
		event.PassengerID,
	)

	return nil
}
