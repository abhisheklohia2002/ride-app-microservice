package httpx

import (
	"net/http"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func HandleGRPCError(w http.ResponseWriter, err error) {
	st, ok := status.FromError(err)

	if !ok {
		Error(
			w,
			http.StatusInternalServerError,
			"An unexpected error occurred",
			"INTERNAL_ERROR",
		)
		return
	}

	switch st.Code() {

	case codes.InvalidArgument:
		Error(
			w,
			http.StatusBadRequest,
			"Invalid request",
			"INVALID_REQUEST",
		)

	case codes.Unauthenticated:
		Error(
			w,
			http.StatusUnauthorized,
			"Authentication required",
			"UNAUTHORIZED",
		)

	case codes.PermissionDenied:
		Error(
			w,
			http.StatusForbidden,
			"You do not have permission to perform this action",
			"FORBIDDEN",
		)

	case codes.NotFound:
		Error(
			w,
			http.StatusNotFound,
			"Resource not found",
			"NOT_FOUND",
		)

	case codes.AlreadyExists:
		Error(
			w,
			http.StatusConflict,
			"Resource already exists",
			"ALREADY_EXISTS",
		)

	case codes.FailedPrecondition:
		Error(
			w,
			http.StatusBadRequest,
			"Request cannot be completed",
			"FAILED_PRECONDITION",
		)

	case codes.Unavailable:
		Error(
			w,
			http.StatusServiceUnavailable,
			"Service is temporarily unavailable",
			"SERVICE_UNAVAILABLE",
		)

	case codes.DeadlineExceeded:
		Error(
			w,
			http.StatusGatewayTimeout,
			"Request timed out",
			"TIMEOUT",
		)

	default:
		Error(
			w,
			http.StatusInternalServerError,
			"An internal server error occurred",
			"INTERNAL_ERROR",
		)
	}
}
