package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	matchingWebSocket "github.com/ride-app/ride-matching-service/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		return origin == "http://localhost:5173" ||
			origin == "http://127.0.0.1:5173"
	},
}

func PassengerSocket(
	hub *matchingWebSocket.Hub,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("passenger websocket request received")

		passengerIDValue :=
			c.Query("passengerId")

		passengerID, err :=
			strconv.ParseUint(
				passengerIDValue,
				10,
				64,
			)

		if err != nil {
			c.JSON(
				http.StatusBadRequest,
				gin.H{
					"error": "invalid passenger id",
				},
			)
			return
		}

		log.Printf(
			"upgrading passenger websocket passenger=%d",
			passengerID,
		)

		conn, err := upgrader.Upgrade(
			c.Writer,
			c.Request,
			nil,
		)

		if err != nil {
			log.Printf(
				"websocket upgrade failed: %v",
				err,
			)
			return
		}

		log.Printf(
			"passenger websocket connected passenger=%d",
			passengerID,
		)

		hub.Register(
			passengerID,
			conn,
		)

		defer func() {
			hub.Remove(
				passengerID,
				conn,
			)

			_ = conn.Close()

			log.Printf(
				"passenger websocket disconnected passenger=%d",
				passengerID,
			)
		}()

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				log.Printf(
					"passenger websocket read error passenger=%d error=%v",
					passengerID,
					err,
				)

				return
			}
		}
	}
}



