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

export interface Destination {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

interface DestinationSearchProps {
  onSelect: (
    destination: Destination,
  ) => void;

  latitude?: number;

  longitude?: number;
}

export default function DestinationSearch({
  onSelect,
  latitude,
  longitude,
}: DestinationSearchProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const autocompleteRef =
    useRef<
      google.maps.places.Autocomplete | null
    >(null);

  const onSelectRef =
    useRef(onSelect);

  useEffect(() => {
    onSelectRef.current =
      onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;

    const initialize =
      async () => {
        if (!inputRef.current) {
          return;
        }

        initializeGoogleMaps();

        await importLibrary(
          "places",
        );

        if (cancelled) {
          return;
        }
        const autocomplete =
          new google.maps.places.Autocomplete(
            inputRef.current,
            {
              fields: [
                "place_id",
                "formatted_address",
                "geometry",
                "name",
              ],

              componentRestrictions: {
                country: "in",
              },

              types: [
                "geocode",
                "establishment",
              ],
            },
          );

        autocompleteRef.current =
          autocomplete;

        if (
          latitude != null &&
          longitude != null
        ) {
          autocomplete.setBounds(
            new google.maps.LatLngBounds(
              {
                lat:
                  latitude - 0.5,

                lng:
                  longitude - 0.5,
              },

              {
                lat:
                  latitude + 0.5,

                lng:
                  longitude + 0.5,
              },
            ),
          );
        }

        /*
         * User selected destination
         */

        autocomplete.addListener(
          "place_changed",
          () => {
            const place =
              autocomplete.getPlace();

            if (
              !place.geometry?.location
            ) {
              return;
            }

            const location =
              place.geometry.location;

            const destination: Destination =
              {
                latitude:
                  location.lat(),

                longitude:
                  location.lng(),

                address:
                  place.formatted_address ??
                  place.name ??
                  "",

                placeId:
                  place.place_id,
              };

            onSelectRef.current(
              destination,
            );
          },
        );
      };

    initialize().catch((error) => {
      console.error(
        "Google Places error:",
        error,
      );
    });

    return () => {
      cancelled = true;

      autocompleteRef.current =
        null;
    };
  }, [
    latitude,
    longitude,
  ]);

  return (
    <input
      ref={inputRef}
      type="text"
      autoComplete="off"
      placeholder="Search destination"
      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
    />
  );
}