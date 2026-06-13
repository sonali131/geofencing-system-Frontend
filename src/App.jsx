import { useState, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Snackbar, Alert } from "@mui/material";

const API = "https://geofence-backend-latest.onrender.com";

// --- Custom Marker Fix ---
const iconSVG = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#58a6ff"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;
const customIcon = L.divIcon({
  className: "custom-icon",
  html: iconSVG,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

function MapRefresher() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 500);
  }, [map]);
  return null;
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [fences, setFences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastClick, setLastClick] = useState(null);

  const [alertData, setAlertData] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [vNo, setVNo] = useState("");
  const [vDriver, setVDriver] = useState("");
  const [gName, setGName] = useState("");
  const [gCat, setGCat] = useState("restricted_zone");
  const [gCoords, setGCoords] = useState("");

  const fetchData = async () => {
    try {
      // FIX 1: Teeno variables (rF, rV, rH) ko yahan destructure karein
      const [rF, rV, rH] = await Promise.all([
        axios.get(`${API}/geofences`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/violations/history`),
      ]);
      setFences(rF.data.geofences || []);
      setVehicles(rV.data.vehicles || []);
      // FIX 2: rH (History response) se data set karein
      setHistory(rH.data.violations || []);
    } catch (e) {
      console.log("Fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    //setState();
    const ws = new WebSocket(API.replace("https", "wss") + "/ws/alerts");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setAlertData(data);
      setLogs((p) => [data, ...p]);
      fetchData(); // Alert aate hi history refresh hogi
    };
    return () => ws.close();
  }, []);

  const handleMapClick = (latlng) => {
    setLastClick(latlng);
    axios.post(`${API}/vehicles/location`, {
      vehicle_id: vehicles[0]?.vehicle_number || "GUEST_01",
      latitude: latlng.lat,
      longitude: latlng.lng,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCreateGeofence = async () => {
    if (!gName || !gCoords) return;
    setLoading(true);
    try {
      const parsedCoords = JSON.parse(gCoords);
      await axios.post(`${API}/geofences`, {
        name: gName,
        category: gCat,
        coordinates: parsedCoords,
      });
      setSuccessMsg(`Success: Zone '${gName}' created!`);
      setGName("");
      setGCoords("");
      fetchData();
    } catch (e) {
      setSuccessMsg("Error: Invalid JSON coordinates!", e);
    }
    setLoading(false);
  };

  const handleRegisterVehicle = async () => {
    if (!vNo) return;
    setLoading(true);
    try {
      await axios.post(`${API}/vehicles`, {
        vehicle_number: vNo,
        driver_name: vDriver,
      });
      setSuccessMsg(`Success: ${vNo} added!`);
      setVNo("");
      setVDriver("");
      fetchData();
    } catch (e) {
      setSuccessMsg("Error: Registration failed.", e);
    }
    setLoading(false);
  };

  const getFenceColor = (cat) => {
    if (cat === "restricted_zone") return "#f85149";
    if (cat === "delivery_zone") return "#3fb950";
    return "#d29922";
  };

  const S = {
    root: {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0d1117",
      color: "#e6edf3",
      fontFamily: "system-ui",
    },
    nav: {
      background: "#161b22",
      borderBottom: "1px solid #30363d",
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      height: 56,
    },
    tab: (a) => ({
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "0 15px",
      fontSize: 12,
      fontWeight: 600,
      color: a ? "#58a6ff" : "#8b949e",
      borderBottom: a ? "2px solid #58a6ff" : "none",
      height: "100%",
    }),
    card: {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 8,
      padding: 20,
    },
    inp: {
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 6,
      color: "#fff",
      padding: "10px",
      width: "100%",
      marginBottom: 12,
      outline: "none",
    },
    btn: {
      background: "#238636",
      color: "#fff",
      border: "none",
      padding: "12px",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: 700,
      width: "100%",
    },
  };

  return (
    <div style={S.root}>
      <nav style={S.nav}>
        <span style={{ fontWeight: 800, marginRight: 25, fontSize: 14 }}>
          GEOFENCE <span style={{ color: "#58a6ff" }}>PRO</span>
        </span>
        {["DASHBOARD", "VEHICLES", "GEOFENCES", "HISTORY"].map((t, i) => (
          <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </nav>

      <div style={{ padding: 25, flexGrow: 1, overflowY: "auto" }}>
        {tab === 0 && (
          <div style={{ display: "flex", gap: 20, height: "80vh" }}>
            <div
              style={{ flex: 2, ...S.card, padding: 0, position: "relative" }}
            >
              <MapContainer
                center={[28.61, 77.23]}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <MapRefresher />
                <MapEvents onMapClick={handleMapClick} />
                {fences.map((f, i) => (
                  <Polygon
                    key={i}
                    positions={(f.coordinates?.coordinates?.[0] || []).map(
                      (p) => [p[1], p[0]],
                    )}
                    pathOptions={{
                      color: getFenceColor(f.category),
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <b>{f.name}</b>
                      <br />
                      Category: {f.category}
                    </Popup>
                  </Polygon>
                ))}
                {lastClick && (
                  <Marker position={lastClick} icon={customIcon}>
                    <Popup>Ping Sent</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 15,
              }}
            >
              <div style={{ ...S.card, flexGrow: 1, overflowY: "auto" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#8b949e" }}>
                  LIVE BREACH LOGS
                </h4>
                {logs.length === 0 ? (
                  <p style={{ color: "#484f58" }}>Waiting...</p>
                ) : (
                  logs.map((l, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        background: "#f8514910",
                        borderRadius: 6,
                        marginBottom: 8,
                        borderLeft: "4px solid #f85149",
                      }}
                    >
                      <div style={{ color: "#f85149", fontWeight: 700 }}>
                        {l.vehicle?.vehicle_id}
                      </div>
                      <div style={{ fontSize: 12, color: "#8b949e" }}>
                        {l.geofence?.geofence_name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ width: 320, ...S.card }}>
              <h3>Register Vehicle</h3>
              <input
                style={S.inp}
                placeholder="Vehicle Number"
                value={vNo}
                onChange={(e) => setVNo(e.target.value)}
              />
              <input
                style={S.inp}
                placeholder="Driver Name"
                value={vDriver}
                onChange={(e) => setVDriver(e.target.value)}
              />
              <button style={S.btn} onClick={handleRegisterVehicle}>
                {loading ? "Saving..." : "Add to Fleet"}
              </button>
            </div>
            <div style={{ flexGrow: 1, ...S.card, padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "#161b22" }}>
                    <th style={{ padding: 15 }}>Vehicle No</th>
                    <th style={{ padding: 15 }}>Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
                      <td style={{ padding: 15 }}>{v.vehicle_number}</td>
                      <td style={{ padding: 15 }}>{v.driver_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ width: 350, ...S.card }}>
              <h3>Create Geofence</h3>
              <input
                style={S.inp}
                placeholder="Zone Name"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
              />
              <select
                style={S.inp}
                value={gCat}
                onChange={(e) => setGCat(e.target.value)}
              >
                <option value="restricted_zone">Restricted</option>
                <option value="delivery_zone">Delivery</option>
              </select>
              <textarea
                style={{ ...S.inp, height: 100 }}
                placeholder="Array: [[lat, lng], ...]"
                value={gCoords}
                onChange={(e) => setGCoords(e.target.value)}
              />
              <button style={S.btn} onClick={handleCreateGeofence}>
                Deploy Zone
              </button>
            </div>
            <div style={{ flexGrow: 1, ...S.card }}>
              <h4>Surveillance Zones</h4>
              {fences.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #21262d",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{f.name}</span>
                  <span style={{ color: getFenceColor(f.category) }}>
                    {f.category.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ ...S.card, padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#161b22" }}>
                <tr>
                  <th style={{ padding: 15, textAlign: "left" }}>Time</th>
                  <th style={{ padding: 15, textAlign: "left" }}>Vehicle</th>
                  <th style={{ padding: 15, textAlign: "left" }}>Zone</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
                    <td style={{ padding: 15 }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: 15, color: "#58a6ff" }}>
                      {h.vehicle?.vehicle_id}
                    </td>
                    <td style={{ padding: 15 }}>{h.geofence?.geofence_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Snackbar
        open={!!alertData}
        autoHideDuration={5000}
        onClose={() => setAlertData(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled">
          🚨 BREACH: {alertData?.vehicle?.vehicle_id} in{" "}
          {alertData?.geofence?.geofence_name}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled">
          {successMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}
