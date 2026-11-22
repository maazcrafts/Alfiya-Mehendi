"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";

const DESTINATION = "Room No. 1613, H-Block, Near Bada Shia Imambada, Lotus Colony, Hamid Hamid Marg, Shivaji Nagar, Govandi West, Mumbai, Maharashtra 400043";
const DESTINATION_QUERY = encodeURIComponent(DESTINATION);

const modes = [
  { id: "transit", label: "Local / Train", icon: "↔", description: "Public transport directions" },
  { id: "driving", label: "Auto / 2-Wheeler", icon: "⌁", description: "Road route" },
  { id: "driving", label: "Cab / Car", icon: "⌖", description: "Driving directions" },
  { id: "walking", label: "Walk", icon: "⌕", description: "Walking route" },
];

function mapsUrl(mode: string, origin: { latitude: number; longitude: number } | null) {
  const originPart = origin ? `&origin=${origin.latitude},${origin.longitude}` : "";
  return `https://www.google.com/maps/dir/?api=1&destination=${DESTINATION_QUERY}&travelmode=${mode}${originPart}`;
}

export default function GettingThere() {
  const [mode, setMode] = useState("transit");
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    document.title = "Getting There · Alfiya Mehendi";
  }, []);

  const selected = useMemo(
    () => modes.find((item) => item.id === mode) || modes[0],
    [mode]
  );

  const openDirections = () => {
    window.open(mapsUrl(mode, position), "_blank", "noopener,noreferrer");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not provide location access.");
      return;
    }

    setGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (value) => {
        setPosition(value.coords);
        setGettingLocation(false);
      },
      () => {
        setLocationError(
          "Location access was not available. You can still open Google Maps and choose your starting point there."
        );
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <main className="page getting-there-page">
      <Header />

      <section className="getting-there-header">
        <div className="container">
          <p className="eyebrow">Your appointment destination</p>
          <h1>Getting there.</h1>
          <p>
            Choose how you want to travel. Google Maps will calculate the current route and travel time.
          </p>
        </div>
      </section>

      <section className="getting-there-section">
        <div className="container">
          <div className="getting-there-destination">
            <p className="eyebrow">Alfiya Mehendi</p>
            <h2>Your appointment is here.</h2>

            <div className="destination-address">
              <span>⌖</span>
              <p>{DESTINATION}</p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={useMyLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? "Getting your location…" : "Use my current location"}
            </button>
          </div>

          {position && (
            <p className="location-ready">
              ✓ Starting point added. Google Maps will use it for directions.
            </p>
          )}

          {locationError && <p className="location-error">{locationError}</p>}

          <div className="route-action-card">
            <div>
              <p className="eyebrow">Selected route</p>
              <h3>{selected.label}</h3>
              <p>
                Google Maps will calculate distance, estimated time, transfers and turn-by-turn directions when available.
              </p>
            </div>

            <div className="route-action-buttons">
              <button type="button" onClick={openDirections} className="btn btn-primary">
                Open directions in Google Maps →
              </button>
              <button type="button" onClick={useMyLocation} className="btn btn-ghost">
                Set my starting point
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="getting-there-section">
        <div className="container">
          <div className="getting-there-section-head">
            <div>
              <p className="eyebrow">Route planner</p>
              <h2>How do you want to travel?</h2>
            </div>
            <span>Live times come from Google Maps</span>
          </div>

          <div className="travel-mode-grid">
            {modes.map((item, index) => (
              <button
                type="button"
                key={`${item.label}-${index}`}
                className={`travel-mode-card ${selected === item ? "active" : ""}`}
                onClick={() => setMode(item.id)}
              >
                <span className="travel-mode-number">0{index + 1}</span>
                <span className="travel-mode-icon">{item.icon}</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                {selected === item && <span className="travel-mode-selected">Selected</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Link href="/booking" className="btn btn-ghost btn-block back-link">
        ← My bookings
      </Link>

      <Footer />
    </main>
  );
}
