package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	driverws "github.com/ride-app/ride-driver-service/internal/common/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func DriverWebSocket(
	hub *driverws.Hub,
) http.HandlerFunc {
	return func(
		w http.ResponseWriter,
		r *http.Request,
	) {
		driverIDValue :=
			r.URL.Query().Get("driverId")

		driverID, err :=
			strconv.ParseUint(
				driverIDValue,
				10,
				64,
			)

		if err != nil {
			http.Error(
				w,
				"invalid driver id",
				http.StatusBadRequest,
			)

			return
		}

		conn, err :=
			upgrader.Upgrade(
				w,
				r,
				nil,
			)

		if err != nil {
			return
		}

		hub.Register(
			driverID,
			conn,
		)

		defer func() {
			hub.Remove(
				driverID,
				conn,
			)

			_ = conn.Close()
		}()

		for {
			if _, _, err :=
				conn.ReadMessage(); err != nil {
				return
			}
		}
	}
}
