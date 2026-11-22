"use client";

import { useState, useEffect } from "react";

export default function LocationMapPreview({ latitude, longitude, address }: { latitude?: number; longitude?: number; address: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="admin-map-preview">
      <div className="admin-map-preview-address">{address || "—"}</div>
      {latitude && longitude && (
        <div className="admin-map-preview-coords">
          {latitude}, {longitude}
        </div>
      )}
    </div>
  );
}