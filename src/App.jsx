// import { useState, useEffect } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   Paper,
//   Snackbar,
//   Alert,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
//   Box,
// } from "@mui/material";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Popup,
//   useMapEvents,
//   useMap,
// } from "react-leaflet";
// import axios from "axios";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// // --- Marker Icon Fix (Reliable Method) ---
// const markerIcon =
//   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
// const markerShadow =
//   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// let DefaultIcon = L.icon({
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// const API = "https://geofence-backend-latest.onrender.com";

// function MapResizer() {
//   const map = useMap();
//   useEffect(() => {
//     setTimeout(() => map.invalidateSize(), 500);
//   }, [map]);
//   return null;
// }

// function MapEvents({ onMapClick }) {
//   useMapEvents({
//     click(e) {
//       console.log("Map Clicked at:", e.latlng.lat, e.latlng.lng);
//       onMapClick(e.latlng);
//     },
//   });
//   return null;
// }

// function App() {
//   const [fences, setFences] = useState([]);
//   const [logs, setLogs] = useState([]);
//   const [alertData, setAlertData] = useState(null);
//   const [lastClick, setLastClick] = useState(null);

//   useEffect(() => {
//     axios.get(`${API}/geofences`).then((res) => {
//       setFences(res.data.geofences || []);
//     });

//     let ws;
//     const connectWS = () => {
//       const wsUrl = API.replace("https", "wss") + "/ws/alerts";
//       ws = new WebSocket(wsUrl);
//       ws.onopen = () => console.log("✅ WebSocket Connected");
//       ws.onmessage = (e) => {
//         const data = JSON.parse(e.data);
//         setAlertData(data);
//         setLogs((prev) => [data, ...prev]);
//       };
//       ws.onclose = () => setTimeout(connectWS, 3000);
//     };
//     connectWS();
//     return () => ws && ws.close();
//   }, []);

//   const handleMapClick = (latlng) => {
//     // 1. UI par marker dikhane ke liye set karein
//     setLastClick([latlng.lat, latlng.lng]);

//     // 2. Backend ko data bhejein
//     axios
//       .post(`${API}/vehicles/location`, {
//         vehicle_id: "VEHICLE_01",
//         latitude: latlng.lat,
//         longitude: latlng.lng,
//         timestamp: new Date().toISOString(),
//       })
//       .then((res) => {
//         console.log("Server Response:", res.data);
//         // Agar current_geofences khali hai toh iska matlab point polygon ke andar nahi maana gaya
//         if (
//           res.data.current_geofences &&
//           res.data.current_geofences.length > 0
//         ) {
//           console.log("📍 Inside Geofence!");
//         } else {
//           console.log("📍 Outside Geofence.");
//         }
//       });
//   };

//   return (
//     <Box style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
//       <AppBar position="static">
//         <Toolbar>
//           <Typography variant="h6">MapUp Geofence System</Typography>
//         </Toolbar>
//       </AppBar>

//       <Box
//         style={{
//           display: "flex",
//           flex: 1,
//           padding: "10px",
//           gap: "10px",
//           backgroundColor: "#f0f0f0",
//           overflow: "hidden",
//         }}
//       >
//         <div style={{ flex: 2, height: "85vh" }}>
//           <Paper
//             elevation={3}
//             style={{ height: "100%", width: "100%", overflow: "hidden" }}
//           >
//             <MapContainer
//               center={[28.6139, 77.209]}
//               zoom={12}
//               style={{ height: "100%", width: "100%" }}
//             >
//               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//               <MapResizer />
//               <MapEvents onMapClick={handleMapClick} />

//               {fences.map((f, i) => {
//                 try {
//                   const raw = f.coordinates?.coordinates || f.coordinates;
//                   const ring = Array.isArray(raw[0][0]) ? raw[0] : raw;
//                   const positions = ring.map((p) => [p[1], p[0]]);
//                   return (
//                     <Polygon
//                       key={i}
//                       positions={positions}
//                       pathOptions={{ color: "red", fillOpacity: 0.4 }}
//                     >
//                       <Popup>{f.name}</Popup>
//                     </Polygon>
//                   );
//                 } catch (e) {
//                   return e;
//                 }
//               })}

//               {/* Fix: Marker position array format mein honi chahiye */}
//               {lastClick && (
//                 <Marker position={lastClick}>
//                   <Popup>Vehicle Location</Popup>
//                 </Marker>
//               )}
//             </MapContainer>
//           </Paper>
//         </div>

//         <Paper
//           elevation={3}
//           style={{
//             flex: 1,
//             height: "85vh",
//             padding: "15px",
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           <Typography variant="h6" fontWeight="bold">
//             Alert Logs
//           </Typography>
//           <Divider style={{ margin: "10px 0" }} />
//           <Box style={{ flexGrow: 1, overflowY: "auto" }}>
//             <List>
//               {logs.length === 0 && (
//                 <Typography variant="body2" color="gray">
//                   No alerts. Click inside RED box.
//                 </Typography>
//               )}
//               {logs.map((log, i) => (
//                 <ListItem key={i} divider>
//                   <ListItemText
//                     primary={
//                       <Typography color="error" variant="subtitle2">
//                         BREACH: {log.vehicle?.vehicle_id}
//                       </Typography>
//                     }
//                     secondary={`${log.geofence?.geofence_name} | ${new Date().toLocaleTimeString()}`}
//                   />
//                 </ListItem>
//               ))}
//             </List>
//           </Box>
//         </Paper>
//       </Box>

//       <Snackbar
//         open={!!alertData}
//         autoHideDuration={3000}
//         onClose={() => setAlertData(null)}
//       >
//         <Alert severity="error" variant="filled">
//           GEOFENCE BREACH DETECTED!
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// }
// export default App;

// import { useState, useEffect } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   Paper,
//   Snackbar,
//   Alert,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
//   Box,
//   Tabs,
//   Tab,
//   TextField,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
// } from "@mui/material";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Popup,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import axios from "axios";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// const API = "https://geofence-backend-latest.onrender.com";

// // --- Marker Fix ---
// const markerIcon =
//   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
// const markerShadow =
//   "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
// L.Marker.prototype.options.icon = L.icon({
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });

// // Yeh function map ko refresh karega
// function MapRefresher() {
//   const map = useMap();
//   useEffect(() => {
//     setTimeout(() => {
//       map.invalidateSize();
//     }, 1000);
//   }, [map]);
//   return null;
// }

// export default function App() {
//   const [tab, setTab] = useState(0);
//   const [fences, setFences] = useState([]);
//   const [logs, setLogs] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [alertData, setAlertData] = useState(null);
//   const [lastClick, setLastClick] = useState(null);
//   const [vNo, setVNo] = useState("");
//   const [vDriver, setVDriver] = useState("");

//   const fetchData = async () => {
//     try {
//       const resF = await axios.get(`${API}/geofences`);
//       const resV = await axios.get(`${API}/vehicles`);
//       const resH = await axios.get(`${API}/violations/history`);
//       setFences(resF.data.geofences || []);
//       setVehicles(resV.data.vehicles || []);
//       setHistory(resH.data.violations || []);
//     } catch (e) {
//       console.log("Fetch Error");
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     const ws = new WebSocket(API.replace("https", "wss") + "/ws/alerts");
//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       setAlertData(data);
//       setLogs((prev) => [data, ...prev]);
//       fetchData();
//     };
//     return () => ws.close();
//   }, []);

//   function MapEvents() {
//     useMapEvents({
//       click(e) {
//         setLastClick([e.latlng.lat, e.latlng.lng]);
//         axios.post(`${API}/vehicles/location`, {
//           vehicle_id: vehicles[0]?.vehicle_number || "TEST_V",
//           latitude: e.latlng.lat,
//           longitude: e.latlng.lng,
//           timestamp: new Date().toISOString(),
//         });
//       },
//     });
//     return null;
//   }

//   return (
//     <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
//       <AppBar position="static">
//         <Toolbar>
//           <Typography sx={{ flexGrow: 1 }}>Geofence Alert System</Typography>
//           <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit">
//             <Tab label="Map" />
//             <Tab label="Vehicles" />
//             <Tab label="History" />
//           </Tabs>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 2, flexGrow: 1, bgcolor: "#eee" }}>
//         {tab === 0 && (
//           <Box>
//             <Paper
//               sx={{
//                 height: "550px",
//                 mb: 2,
//                 overflow: "hidden",
//                 border: "5px solid white",
//               }}
//             >
//               <MapContainer
//                 center={[28.61, 77.23]}
//                 zoom={11}
//                 style={{ height: "100%", width: "100%" }}
//               >
//                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
//                 <MapRefresher />
//                 <MapEvents />
//                 {fences.map((f, i) => {
//                   const coords = f.coordinates?.coordinates?.[0] || [];
//                   const positions = coords.map((p) => [p[1], p[0]]);
//                   return (
//                     <Polygon
//                       key={i}
//                       positions={positions}
//                       pathOptions={{ color: "red" }}
//                     />
//                   );
//                 })}
//                 {lastClick && <Marker position={lastClick} />}
//               </MapContainer>
//             </Paper>
//             <Paper sx={{ p: 2, maxHeight: "200px", overflowY: "auto" }}>
//               <Typography variant="h6">Live Alerts</Typography>
//               {logs.map((l, i) => (
//                 <Typography key={i} color="error">
//                   {l.vehicle?.vehicle_id} breached {l.geofence?.geofence_name}
//                 </Typography>
//               ))}
//             </Paper>
//           </Box>
//         )}

//         {tab === 1 && (
//           <Box sx={{ display: "flex", gap: 2 }}>
//             <Paper sx={{ p: 2, width: "300px" }}>
//               <TextField
//                 fullWidth
//                 label="Vehicle No"
//                 value={vNo}
//                 onChange={(e) => setVNo(e.target.value)}
//                 margin="dense"
//               />
//               <TextField
//                 fullWidth
//                 label="Driver"
//                 value={vDriver}
//                 onChange={(e) => setVDriver(e.target.value)}
//                 margin="dense"
//               />
//               <Button
//                 fullWidth
//                 variant="contained"
//                 onClick={async () => {
//                   await axios.post(`${API}/vehicles`, {
//                     vehicle_number: vNo,
//                     driver_name: vDriver,
//                   });
//                   setVNo("");
//                   setVDriver("");
//                   fetchData();
//                 }}
//               >
//                 Add
//               </Button>
//             </Paper>
//             <TableContainer component={Paper}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Reg No</TableCell>
//                     <TableCell>Driver</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {vehicles.map((v, i) => (
//                     <TableRow key={i}>
//                       <TableCell>{v.vehicle_number}</TableCell>
//                       <TableCell>{v.driver_name}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Box>
//         )}

//         {tab === 2 && (
//           <TableContainer component={Paper}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Time</TableCell>
//                   <TableCell>Vehicle</TableCell>
//                   <TableCell>Zone</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {history.map((h, i) => (
//                   <TableRow key={i}>
//                     <TableCell>
//                       {new Date(h.timestamp).toLocaleString()}
//                     </TableCell>
//                     <TableCell>{h.vehicle?.vehicle_id}</TableCell>
//                     <TableCell>{h.geofence?.geofence_name}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </Box>

//       <Snackbar
//         open={!!alertData}
//         autoHideDuration={3000}
//         onClose={() => setAlertData(null)}
//       >
//         <Alert severity="error">BREACH!</Alert>
//       </Snackbar>
//     </Box>
//   );
// }
// ---good code end--
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
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Map as MapIcon,
  LocalShipping,
  History as HistoryIcon,
  NotificationsActive,
  Person,
} from "@mui/icons-material";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import axios from "axios";
import L from "leaflet";

// Leaflet CSS
import "leaflet/dist/leaflet.css";

const API = "https://geofence-backend-latest.onrender.com";

// --- Marker Icon Fix (Standard CDN links) ---
const markerIcon =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const markerShadow =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- HELPER COMPONENTS (Defined outside to avoid re-renders) ---

// Force Map to show tiles properly
function MapFixer({ tabValue }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [tabValue, map]);
  return null;
}

// Handle Clicks on Map
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const [tab, setTab] = useState(0);
  const [fences, setFences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [alertData, setAlertData] = useState(null);
  const [lastClick, setLastClick] = useState(null);
  const [vNo, setVNo] = useState("");
  const [vDriver, setVDriver] = useState("");

  // 1. Fetch All Data from MongoDB
  const fetchData = async () => {
    try {
      const [resF, resV, resH] = await Promise.all([
        axios.get(`${API}/geofences`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/violations/history`),
      ]);
      setFences(resF.data.geofences || []);
      setVehicles(resV.data.vehicles || []);
      setHistory(resH.data.violations || []);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchData();

    // 2. WebSocket Setup for Real-time Alerts
    const wsUrl = API.replace("https", "wss") + "/ws/alerts";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("✅ WebSocket Connected");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setAlertData(data);
      setLogs((prev) => [data, ...prev]);
      fetchData(); // History refresh
    };

    return () => ws.close();
  }, []);

  // 3. Handle Location Update on Click
  const handleMapClick = (latlng) => {
    setLastClick([latlng.lat, latlng.lng]);
    axios.post(`${API}/vehicles/location`, {
      vehicle_id:
        vehicles.length > 0 ? vehicles[0].vehicle_number : "GUEST_VEH_01",
      latitude: latlng.lat,
      longitude: latlng.lng,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f6f9",
      }}
    >
      {/* Navigation Bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#1a237e" }}>
        <Toolbar>
          <MapIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            GEOFENCE PRO
          </Typography>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Monitor" icon={<MapIcon />} iconPosition="start" />
            <Tab
              label="Registry"
              icon={<LocalShipping />}
              iconPosition="start"
            />
            <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: "hidden" }}>
        {/* TAB 0: LIVE MONITORING */}
        {tab === 0 && (
          <Grid container spacing={3} sx={{ height: "100%" }}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={4}
                sx={{
                  height: "78vh",
                  borderRadius: 4,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <MapContainer
                  center={[28.61, 77.23]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <MapFixer tabValue={tab} />
                  <MapEvents onMapClick={handleMapClick} />

                  {fences.map((f, i) => {
                    const rawCoords = f.coordinates?.coordinates?.[0] || [];
                    const positions = rawCoords.map((p) => [p[1], p[0]]); // Swap Lng/Lat to Lat/Lng
                    return (
                      <Polygon
                        key={i}
                        positions={positions}
                        pathOptions={{ color: "#d32f2f", fillOpacity: 0.3 }}
                      />
                    );
                  })}

                  {lastClick && (
                    <Marker position={lastClick}>
                      <Popup>Vehicle Pinged Here</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={4}
                sx={{
                  height: "78vh",
                  p: 2,
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <NotificationsActive color="error" sx={{ mr: 1 }} /> Live
                  Breach Logs
                </Typography>
                <Divider />
                <List sx={{ flexGrow: 1, overflowY: "auto" }}>
                  {logs.length === 0 ? (
                    <Typography sx={{ p: 2, color: "gray" }}>
                      No active alerts.
                    </Typography>
                  ) : (
                    logs.map((l, i) => (
                      <ListItem key={i} divider>
                        <ListItemText
                          primary={
                            <Typography color="error" fontWeight="bold">
                              {l.vehicle?.vehicle_id}
                            </Typography>
                          }
                          secondary={`Area: ${l.geofence?.geofence_name} | ${new Date().toLocaleTimeString()}`}
                        />
                        <Chip label="BREACH" color="error" size="small" />
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: VEHICLE REGISTRY */}
        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Add New Vehicle
                </Typography>
                <TextField
                  fullWidth
                  label="Registration No."
                  value={vNo}
                  onChange={(e) => setVNo(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Driver Name"
                  value={vDriver}
                  onChange={(e) => setVDriver(e.target.value)}
                  margin="normal"
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, bgcolor: "#1a237e" }}
                  onClick={async () => {
                    await axios.post(`${API}/vehicles`, {
                      vehicle_number: vNo,
                      driver_name: vDriver,
                    });
                    setVNo("");
                    setVDriver("");
                    fetchData();
                  }}
                >
                  Register to DB
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: "#eee" }}>
                    <TableRow>
                      <TableCell>
                        <b>VEHICLE ID</b>
                      </TableCell>
                      <TableCell>
                        <b>DRIVER</b>
                      </TableCell>
                      <TableCell>
                        <b>STATUS</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((v, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                mr: 2,
                                bgcolor: "#e8eaf6",
                                color: "#1a237e",
                              }}
                            >
                              <Person />
                            </Avatar>
                            {v.vehicle_number}
                          </Box>
                        </TableCell>
                        <TableCell>{v.driver_name}</TableCell>
                        <TableCell>
                          <Chip
                            label="Active"
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: VIOLATION HISTORY */}
        {tab === 2 && (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 4, maxHeight: "75vh" }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#333", color: "#fff" }}>
                    <b>TIMESTAMP</b>
                  </TableCell>
                  <TableCell sx={{ bgcolor: "#333", color: "#fff" }}>
                    <b>VEHICLE</b>
                  </TableCell>
                  <TableCell sx={{ bgcolor: "#333", color: "#fff" }}>
                    <b>GEOGRAPHIC ZONE</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      {new Date(h.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {h.vehicle?.vehicle_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={h.geofence?.geofence_name} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Global Alert Notification */}
      <Snackbar
        open={!!alertData}
        autoHideDuration={4000}
        onClose={() => setAlertData(null)}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          🚨 ALERT: {alertData?.vehicle?.vehicle_id} Entered Restricted Area!
        </Alert>
      </Snackbar>
    </Box>
  );
}
