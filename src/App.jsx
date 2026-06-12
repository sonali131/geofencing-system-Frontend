import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Marker Icon Fix (Reliable Method) ---
const markerIcon =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const markerShadow =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const API = "https://geofence-backend-latest.onrender.com";

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 500);
  }, [map]);
  return null;
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      console.log("Map Clicked at:", e.latlng.lat, e.latlng.lng);
      onMapClick(e.latlng);
    },
  });
  return null;
}

function App() {
  const [fences, setFences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [alertData, setAlertData] = useState(null);
  const [lastClick, setLastClick] = useState(null);

  useEffect(() => {
    axios.get(`${API}/geofences`).then((res) => {
      setFences(res.data.geofences || []);
    });

    let ws;
    const connectWS = () => {
      const wsUrl = API.replace("https", "wss") + "/ws/alerts";
      ws = new WebSocket(wsUrl);
      ws.onopen = () => console.log("✅ WebSocket Connected");
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setAlertData(data);
        setLogs((prev) => [data, ...prev]);
      };
      ws.onclose = () => setTimeout(connectWS, 3000);
    };
    connectWS();
    return () => ws && ws.close();
  }, []);

  const handleMapClick = (latlng) => {
    // 1. UI par marker dikhane ke liye set karein
    setLastClick([latlng.lat, latlng.lng]);

    // 2. Backend ko data bhejein
    axios
      .post(`${API}/vehicles/location`, {
        vehicle_id: "VEHICLE_01",
        latitude: latlng.lat,
        longitude: latlng.lng,
        timestamp: new Date().toISOString(),
      })
      .then((res) => {
        console.log("Server Response:", res.data);
        // Agar current_geofences khali hai toh iska matlab point polygon ke andar nahi maana gaya
        if (
          res.data.current_geofences &&
          res.data.current_geofences.length > 0
        ) {
          console.log("📍 Inside Geofence!");
        } else {
          console.log("📍 Outside Geofence.");
        }
      });
  };

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">MapUp Geofence System</Typography>
        </Toolbar>
      </AppBar>

      <Box
        style={{
          display: "flex",
          flex: 1,
          padding: "10px",
          gap: "10px",
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 2, height: "85vh" }}>
          <Paper
            elevation={3}
            style={{ height: "100%", width: "100%", overflow: "hidden" }}
          >
            <MapContainer
              center={[28.6139, 77.209]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapResizer />
              <MapEvents onMapClick={handleMapClick} />

              {fences.map((f, i) => {
                try {
                  const raw = f.coordinates?.coordinates || f.coordinates;
                  const ring = Array.isArray(raw[0][0]) ? raw[0] : raw;
                  const positions = ring.map((p) => [p[1], p[0]]);
                  return (
                    <Polygon
                      key={i}
                      positions={positions}
                      pathOptions={{ color: "red", fillOpacity: 0.4 }}
                    >
                      <Popup>{f.name}</Popup>
                    </Polygon>
                  );
                } catch (e) {
                  return e;
                }
              })}

              {/* Fix: Marker position array format mein honi chahiye */}
              {lastClick && (
                <Marker position={lastClick}>
                  <Popup>Vehicle Location</Popup>
                </Marker>
              )}
            </MapContainer>
          </Paper>
        </div>

        <Paper
          elevation={3}
          style={{
            flex: 1,
            height: "85vh",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Alert Logs
          </Typography>
          <Divider style={{ margin: "10px 0" }} />
          <Box style={{ flexGrow: 1, overflowY: "auto" }}>
            <List>
              {logs.length === 0 && (
                <Typography variant="body2" color="gray">
                  No alerts. Click inside RED box.
                </Typography>
              )}
              {logs.map((log, i) => (
                <ListItem key={i} divider>
                  <ListItemText
                    primary={
                      <Typography color="error" variant="subtitle2">
                        BREACH: {log.vehicle?.vehicle_id}
                      </Typography>
                    }
                    secondary={`${log.geofence?.geofence_name} | ${new Date().toLocaleTimeString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={!!alertData}
        autoHideDuration={3000}
        onClose={() => setAlertData(null)}
      >
        <Alert severity="error" variant="filled">
          GEOFENCE BREACH DETECTED!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
