package workers

import (
	"context"
	"log"
	"time"

	"github.com/ride-service/internal/messaging/rabbitmq"
	"github.com/ride-service/internal/repository"
)

type OutboxWorker struct {
	repo      repository.Repository
	publisher *rabbitmq.Publisher
}

func NewOutboxWorker(
	repo repository.Repository,
	publisher *rabbitmq.Publisher,
) *OutboxWorker {
	return &OutboxWorker{
		repo:      repo,
		publisher: publisher,
	}
}

func (w *OutboxWorker) Start(
	ctx context.Context,
) {

	ticker := time.NewTicker(
		2 * time.Second,
	)

	defer ticker.Stop()

	for {
		select {

		case <-ctx.Done():
			return

		case <-ticker.C:
			w.process(ctx)
		}
	}
}

func (w *OutboxWorker) process(
	ctx context.Context,
) {

	events, err := w.repo.GetPendingOutboxEvents(
		ctx,
		100,
	)

	if err != nil {
		log.Printf(
			"failed to fetch outbox events: %v",
			err,
		)

		return
	}

	for _, event := range events {

		err := w.publisher.Publish(
			event.EventType,
			[]byte(event.Payload),
		)

		if err != nil {

			log.Printf(
				"failed to publish event %d: %v",
				event.ID,
				err,
			)

			_ = w.repo.IncrementOutboxRetry(
				ctx,
				event.ID,
			)

			continue
		}

		if err := w.repo.MarkOutboxPublished(
			ctx,
			event.ID,
		); err != nil {

			log.Printf(
				"failed to mark event %d published: %v",
				event.ID,
				err,
			)

			continue
		}

		log.Printf(
			"outbox event %d published",
			event.ID,
		)
	}
}
