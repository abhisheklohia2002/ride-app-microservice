package consumers

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"strings"

	"github.com/rabbitmq/amqp091-go"
	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/services"
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
		rabbitmq.RideExchange,
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

	log.Printf(
		"ride searching received ride=%d pickup=(%f,%f)",
		event.RideID,
		event.PickupLatitude,
		event.PickupLongitude,
	)

	drivers, err := c.matchingService.FindNearbyDrivers(
		ctx,
		event.PickupLatitude,
		event.PickupLongitude,
		15,
	)
	if err != nil {
		return err
	}

	if len(drivers) == 0 {
		log.Printf(
			"no nearby driver found ride=%d",
			event.RideID,
		)

		return nil
	}

	log.Printf(
		"ride=%d nearby drivers=%v",
		event.RideID,
		drivers,
	)

	driverName := drivers[0]

	driverIDString := strings.TrimPrefix(
		driverName,
		"driver:",
	)

	driverID, err := strconv.ParseUint(
		driverIDString,
		10,
		64,
	)
	if err != nil {
		return err
	}

	log.Printf(
		"driver selected ride=%d driver=%d",
		event.RideID,
		driverID,
	)

	request := RideRequestedEvent{
		RideID:      event.RideID,
		PassengerID: event.PassengerID,
		DriverID:    driverID,

		PickupLatitude:  event.PickupLatitude,
		PickupLongitude: event.PickupLongitude,

		DropoffLatitude:  event.DropoffLatitude,
		DropoffLongitude: event.DropoffLongitude,

		VehicleType: event.VehicleType,
	}

	body, err := json.Marshal(request)
	if err != nil {
		return err
	}

	err = c.rabbitConsumer.Publish(
		rabbitmq.RideExchange,
		"RIDE_REQUESTED",
		body,
	)
	if err != nil {
		return err
	}

	log.Printf(
		"ride request published ride=%d driver=%d",
		event.RideID,
		driverID,
	)

	return nil
}
