"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

const DEFAULT_CENTER = { lat: 19.0760, lng: 72.8777 };
const LEAFLET_VERSION = "1.9.4";
const PHOTON_BASE = "https://photon.komoot.io";

let leafletLoaderPromise: null | Promise<typeof L> = null;

function validPoint(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 &&
    Number(latitude) <= 90 &&
    Number(longitude) >= -180 &&
    Number(longitude) <= 180
  );
}

function formatPhotonFeature(feature: any) {
  const properties = feature?.properties || {};
  return [
    properties.housenumber,
    properties.street,
    properties.name,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter((value: any) => Boolean(value))
    .filter(
      (value: any, index: any, values: any[]) =>
        values.indexOf(value) === index
    )
    .join(", ");
}

async function photon(pathname: string, params?: any, signal?: any) {
  const query = new URLSearchParams(params || {});
  const response = await fetch(PHOTON_BASE + pathname + "?" + query.toString(), {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) throw new Error("Location service is temporarily unavailable.");
  return response.json();
}

function loadLeaflet(): Promise<typeof L> {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoaderPromise) return leafletLoaderPromise;

  leafletLoaderPromise = new Promise<typeof L>((resolve, reject) => {
    const existingCss = document.querySelector(
      'link[data-alfiya-leaflet]'
    );
    if (!existingCss) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      css.dataset.alfiyaLeaflet = "true";
      document.head.appendChild(css);
    }

    const existingScript = document.querySelector(
      'script[data-alfiya-leaflet]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Map library could not be loaded.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.dataset.alfiyaLeaflet = "true";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Map library could not be loaded."));
    document.head.appendChild(script);
  });

  return leafletLoaderPromise;
}

export default function LocationPicker({
  value = "",
  latitude = null,
  longitude = null,
  onChange,
}: {
  value?: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange: (address: string, latitude: number, longitude: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const requestIdRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const clickHandlerRef = useRef<((event: L.LeafletMouseEvent) => void) | null>(null);
  const dragHandlerRef = useRef<((event: L.DragEndEvent) => void) | null>(null);
  const cancelledRef = { current: false };
  const setCancelledRef = (value: { current: false }) => {
    cancelledRef.current = false;
  };

  const locationComplete = validPoint(latitude, longitude) && Boolean(value?.trim());

  // Sync onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Leaflet map
  useEffect(() => {
    async function init() {
      try {
        const L = await loadLeaflet();
        if (!mapRef.current) return;

        const initial = validPoint(latitude, longitude)
          ? { lat: Number(latitude), lng: Number(longitude) }
          : DEFAULT_CENTER;

        const map = L.map(mapRef.current, {
          center: [initial.lat, initial.lng],
          zoom: validPoint(latitude, longitude) ? 16 : 11,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        const initialLat = validPoint(latitude, longitude)
          ? Number(latitude)
          : DEFAULT_CENTER.lat;
        const initialLng = validPoint(latitude, longitude) ? Number(longitude) : DEFAULT_CENTER.lng;

        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
          autoPan: true,
        }).addTo(map);

        if (!validPoint(latitude, longitude)) {
          marker.setOpacity(0);
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Click handler
        const clickHandler = (event: L.LeafletMouseEvent) => {
          const lat = event.latlng.lat;
          const lng = event.latlng.lng;
          selectPoint({ lat, lng });
        };

        // Drag handler
        const dragHandler = (event: L.DragEndEvent) => {
          const point = markerRef.current!.getLatLng();
          selectPoint({ lat: point.lat, lng: point.lng });
        };

        clickHandlerRef.current = clickHandler;
        dragHandlerRef.current = dragHandler;

        async function selectPoint(point: { lat: number; lng: number }) {
          if (!validPoint(point.lat, point.lng)) return;

          const requestId = ++requestIdRef.current;
          markerRef.current!.setLatLng([point.lat, point.lng] as [number, number]).setOpacity(1);
          mapInstanceRef.current!.setView([point.lat, point.lng] as [number, number], 16);

          setBusy(true);
          setError("");

          try {
            const result = await photon("/reverse", {
              lat: String(point.lat),
              lon: String(point.lng),
              zoom: "18",
            });

            if (cancelledRef.current || requestId !== requestIdRef.current)
              return;

            onChangeRef.current?.(formatPhotonFeature(result.features?.[0]) || value || "", point.lat, point.lng);
          } catch (requestError: any) {
            if (
              cancelledRef.current ||
              requestError?.name === "AbortError" ||
              requestId !== requestIdRef.current
            )
              return;

            onChangeRef.current?.(value || "Selected map location", point.lat, point.lng);
            setError(
              requestError.message || "We could not read the selected address."
            );
          } finally {
            if (!cancelledRef.current && requestId === requestIdRef.current)
              setBusy(false);
          }
        }

        map.on("click", clickHandlerRef.current);
        marker.on("dragend", dragHandlerRef.current);
        setReady(true);
        setTimeout(() => map.invalidateSize(), 0);
      } catch (initError: any) {
        if (!cancelledRef.current) setError(initError?.message || "The map could not be loaded.");
      }
    }

    init();

    return () => {
      cancelledRef.current = true;
      if (mapInstanceRef.current) {
        if (clickHandlerRef.current)
          mapInstanceRef.current!.off("click", clickHandlerRef.current);
        if (markerRef.current && dragHandlerRef.current)
          markerRef.current!.off("dragend", dragHandlerRef.current);
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep marker in sync
  useEffect(() => {
    if (!ready || !validPoint(latitude, longitude) || !mapInstanceRef.current || !markerRef.current) return;
    const point = [Number(latitude), Number(longitude)] as [number, number];
    markerRef.current.setLatLng(point).setOpacity(1);
    mapInstanceRef.current.panTo(point);
  }, [ready, latitude, longitude]);

  // Search location
  async function searchLocation(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim();

    if (!query) {
      setResults([]);
      setError("Enter an address or area to search.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setBusy(true);
    setError("");
    setResults([]);

    try {
      const data = await photon("/api", { q: query, limit: "5" });

      if (requestId !== requestIdRef.current) return;

      if (!Array.isArray(data?.features) || data.features.length === 0) {
        setError("No matching location found. Try a more specific address.");
        return;
      }

      setResults(data.features);
    } catch (requestError: any) {
      if (
        requestError?.name !== "AbortError" &&
        requestId === requestIdRef.current
      ) {
        setError(requestError.message || "We could not search that location.");
      }
    } finally {
      if (requestId === requestIdRef.current) setBusy(false);
    }
  }

  async function chooseSearchResult(result: any) {
    const point = {
      lat: Number(result.geometry?.coordinates?.[1]),
      lng: Number(result.geometry?.coordinates?.[0]),
    };

    if (!validPoint(point.lat, point.lng)) {
      setError("That search result did not include a valid map location.");
      return;
    }

    const address = formatPhotonFeature(result);
    if (!address) {
      setError("That result does not contain a usable address. Try another result.");
      return;
    }

    if (mapInstanceRef.current) mapInstanceRef.current.setView([point.lat, point.lng] as [number, number], 17);
    if (markerRef.current) markerRef.current.setLatLng([point.lat, point.lng] as [number, number]).setOpacity(1);

    onChangeRef.current?.(address, point.lat, point.lng);

    setSearch(address);
    setResults([]);
    setError("");
    setEditing(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access. Search for your address instead.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setError("");
    setResults([]);
    setBusy(true);

    navigator.geolocation.getCurrentPosition(
      async (position: any) => {
        if (requestId !== requestIdRef.current) return;

        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (!validPoint(point.lat, point.lng)) {
          setBusy(false);
          setError("Your device returned an invalid location.");
          return;
        }

        const map = mapInstanceRef.current;
        const marker = markerRef.current;

        if (map) map.setView([point.lat, point.lng] as [number, number], 17);
        if (marker) marker.setLatLng([point.lat, point.lng] as [number, number]).setOpacity(1);

        try {
          const result = await photon("/reverse", {
            lat: String(point.lat),
            lon: String(point.lng),
            zoom: "18",
          });

          if (requestId !== requestIdRef.current) return;

          const address = formatPhotonFeature(result.features?.[0]) || "Current device location";
          onChangeRef.current?.(formatPhotonFeature(result.features?.[0]) || "Current device location", point.lat, point.lng);
          setSearch(address);
          setResults([]);
          setEditing(false);
        } catch (requestError: any) {
          if (
            requestId !== requestIdRef.current ||
            requestError?.name === "AbortError"
          )
            return;

          onChangeRef.current?.("Current device location", point.lat, point.lng);
          setSearch("Current device location");
          setResults([]);
          setEditing(false);
          setError("Location found, but the address could not be read. The map pin is still saved.");
        } finally {
          if (requestId === requestIdRef.current) setBusy(false);
        }
      },
      (locationError: any) => {
        if (requestId !== requestIdRef.current) return;

        const message =
          locationError.code === 1
            ? "Location permission was denied. Search for your address instead."
            : locationError.code === 2
            ? "Your current location is unavailable. Check device location services or search for your address."
            : "Location detection timed out. Try again or search for your address.";

        setError(message);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
    );
  }

  const displayResults = results.map((result: any) => ({
    ...result,
    address: formatPhotonFeature(result),
  }));

  // Handle form change for search input
  useEffect(() => {
    if (locationComplete) {
      setSearch(value.trim());
      setEditing(false);
    }
  }, [locationComplete, value]);

  // Set cancelled ref for use in selectPoint
  cancelledRef.current = false;

  return (
    <div className="booking-location-picker">
      <div className="booking-location-picker-head">
        <div>
          <span className="booking-field-label">Where should we come?</span>
          <p>Alfiya comes to the location you choose for the appointment.</p>
        </div>
        {locationComplete && !editing ? (
          <div className="booking-location-complete-badge" role="status">
            <span aria-hidden="true">✓</span>
            Location added
          </div>
        ) : (
          <button
            type="button"
            className="booking-current-location"
            onClick={useCurrentLocation}
            disabled={!ready || busy}
          >
            {busy ? "Locating…" : "Use my current location"}
          </button>
        )}
      </div>

      {locationComplete && !editing ? (
        <div className="booking-location-complete">
          <div className="booking-location-complete-icon" aria-hidden="true">✓</div>
          <div className="booking-location-complete-copy">
            <strong>Appointment location is set</strong>
            <span>{value}</span>
          </div>
          <button
            type="button"
            className="booking-location-change"
            onClick={() => {
              setEditing(true);
              setError("");
              setResults([]);
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <form className="booking-location-search" onSubmit={searchLocation}>
            <input
              type="search"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setError("");
              }}
              placeholder="Search your home or appointment address"
              aria-label="Search appointment location"
              autoComplete="street-address"
            />
            <button type="submit" disabled={!ready || busy}>
              {busy ? "Searching…" : "Search"}
            </button>
          </form>

          {results.length > 0 && (
            <div className="booking-location-results" role="listbox" aria-label="Location search results">
              {displayResults.map((result: any, index: number) => (
                <button
                  key={result.properties?.osm_id || result.properties?.osm_type + "-" + index}
                  type="button"
                  className="booking-location-result"
                  onClick={() => chooseSearchResult(result)}
                >
                  <strong>{result.address || "Location result"}</strong>
                  <span>{result.properties?.country || "Map result"}</span>
                </button>
              ))}
            </div>
          )}

          {editing && (
            <button
              type="button"
              className="booking-location-cancel-change"
              onClick={() => {
                setEditing(false);
                setSearch(value);
                setResults([]);
                setError("");
              }}
            >
              Keep current location
            </button>
          )}
        </>
      )}

      <div className="booking-map-wrap">
        <div className="booking-map" ref={mapRef} aria-label="Select appointment location on OpenStreetMap" />
        <div className="booking-map-hint">
          {locationComplete
            ? "Location saved. Drag the pin or tap the map only if you want to change it."
            : "Search an address, use your current location, or tap/drag the pin to set the exact place."}
        </div>
      </div>

      <div className="booking-location-value">
        <small>Appointment address</small>
        <strong>{value || "Choose a location on the map"}</strong>
        {validPoint(latitude, longitude) && (
          <span>
            Location pin saved ·{" "}
            {Number(latitude)
              .toFixed(5)}
            , {Number(longitude).toFixed(5)}
          </span>
        )}
      </div>

      {error && <p className="booking-location-error" role="alert">{error}</p>}
      <p className="booking-location-attribution">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.
      </p>
    </div>
  );
}