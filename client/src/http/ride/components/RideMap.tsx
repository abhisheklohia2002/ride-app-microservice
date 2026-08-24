import {
  useEffect,
  useRef,
} from "react";

import {
  importLibrary,
} from "@googlemaps/js-api-loader";

import {
  initializeGoogleMaps,
} from "@/lib/google-maps";

interface Location {
  latitude: number;
  longitude: number;
}

interface RideMapProps {
  pickup: Location;

  destination: Location | null;

  onRouteChange?: (
    distanceMeters: number,
    durationMillis: number,
  ) => void;
}

export default function RideMap({
  pickup,
  destination,
  onRouteChange,
}: RideMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<google.maps.Map | null>(null);

  const pickupMarkerRef =
    useRef<
      google.maps.marker.AdvancedMarkerElement | null
    >(null);

  const destinationMarkerRef =
    useRef<
      google.maps.marker.AdvancedMarkerElement | null
    >(null);

  const routePolylinesRef =
    useRef<google.maps.Polyline[]>([]);

  const onRouteChangeRef =
    useRef(onRouteChange);

  useEffect(() => {
    onRouteChangeRef.current =
      onRouteChange;
  }, [onRouteChange]);

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      if (!mapContainerRef.current) {
        return;
      }

      initializeGoogleMaps();

      const [
        mapsLibrary,
        markerLibrary,
      ] = await Promise.all([
        importLibrary("maps"),
        importLibrary("marker"),
      ]);

      if (cancelled) {
        return;
      }

      const {
        Map,
      } =
        mapsLibrary as google.maps.MapsLibrary;

      const {
        AdvancedMarkerElement,
      } =
        markerLibrary as google.maps.MarkerLibrary;

      /*
       * Create map only once
       */
      if (!mapRef.current) {
        mapRef.current = new Map(
          mapContainerRef.current,
          {
            center: {
              lat: pickup.latitude,
              lng: pickup.longitude,
            },

            zoom: 14,

            mapId: "DEMO_MAP_ID",

            mapTypeControl: false,

            streetViewControl: false,

            fullscreenControl: false,

            zoomControl: true,
          },
        );
      }

      const map = mapRef.current;

      /*
       * -------------------------
       * PICKUP MARKER
       * -------------------------
       */

      const pickupPosition = {
        lat: pickup.latitude,
        lng: pickup.longitude,
      };

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current =
          new AdvancedMarkerElement({
            map,
            position: pickupPosition,
            title: "Pickup location",
          });
      } else {
        pickupMarkerRef.current.position =
          pickupPosition;

        pickupMarkerRef.current.map =
          map;
      }

      /*
       * -------------------------
       * NO DESTINATION
       * -------------------------
       */

      if (!destination) {
        /*
         * Remove destination marker
         */

        if (
          destinationMarkerRef.current
        ) {
          destinationMarkerRef.current.map =
            null;

          destinationMarkerRef.current =
            null;
        }

        /*
         * Remove route
         */

        routePolylinesRef.current.forEach(
          (polyline) => {
            polyline.setMap(null);
          },
        );

        routePolylinesRef.current = [];

        /*
         * Center pickup
         */

        map.setCenter(
          pickupPosition,
        );

        map.setZoom(14);

        return;
      }

      /*
       * -------------------------
       * DESTINATION MARKER
       * -------------------------
       */

      const destinationPosition = {
        lat: destination.latitude,
        lng: destination.longitude,
      };

      if (
        !destinationMarkerRef.current
      ) {
        destinationMarkerRef.current =
          new AdvancedMarkerElement({
            map,
            position:
              destinationPosition,
            title: "Destination",
          });
      } else {
        destinationMarkerRef.current.position =
          destinationPosition;

        destinationMarkerRef.current.map =
          map;
      }

      /*
       * -------------------------
       * CLEAR OLD ROUTE
       * -------------------------
       */

      routePolylinesRef.current.forEach(
        (polyline) => {
          polyline.setMap(null);
        },
      );

      routePolylinesRef.current = [];

      /*
       * -------------------------
       * ROUTES API
       * -------------------------
       */

      const routesLibrary =
        (await importLibrary(
          "routes",
        )) as google.maps.RoutesLibrary;

      if (cancelled) {
        return;
      }

      const {
        Route,
      } = routesLibrary;

      const response =
        await Route.computeRoutes({
          origin: pickupPosition,

          destination:
            destinationPosition,

          travelMode: "DRIVING",

          fields: [
            "path",
            "distanceMeters",
            "durationMillis",
          ],
        });

      if (cancelled) {
        return;
      }

      if (
        !response.routes ||
        response.routes.length === 0
      ) {
        console.warn(
          "No route found",
        );

        return;
      }

      const route =
        response.routes[0];

      /*
       * -------------------------
       * DRAW ACTUAL ROAD ROUTE
       * -------------------------
       */

      const polylines =
        route.createPolylines();

      polylines.forEach(
        (polyline) => {
          polyline.setOptions({
            strokeColor: "#111827",
            strokeOpacity: 0.9,
            strokeWeight: 6,
          });

          polyline.setMap(map);
        },
      );

      routePolylinesRef.current =
        polylines;

      /*
       * -------------------------
       * DISTANCE + ETA
       * -------------------------
       */

      if (
        route.distanceMeters != null &&
        route.durationMillis != null
      ) {
        onRouteChangeRef.current?.(
          route.distanceMeters,
          route.durationMillis,
        );
      }

      /*
       * -------------------------
       * FIT BOTH MARKERS + ROUTE
       * -------------------------
       */

      if (route.path) {
        const bounds =
          new google.maps.LatLngBounds();

        bounds.extend(
          pickupPosition,
        );

        bounds.extend(
          destinationPosition,
        );

        route.path.forEach(
          (point) => {
            bounds.extend(point);
          },
        );

        map.fitBounds(
          bounds,
          100,
        );
      }
    };

    loadMap().catch((error) => {
      console.error(
        "Google Maps error:",
        error,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [
    pickup.latitude,
    pickup.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
    />
  );
}