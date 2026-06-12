import { useState, useEffect } from "react";
import axios from "axios";
import { 
  MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "https://geofence-backend-latest.onrender.com";

// --- Custom Marker Fix ---
const iconSVG = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#58a6ff"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;
const customIcon = L.divIcon({ className: "custom-icon", html: iconSVG, iconSize: [24, 36], iconAnchor: [12, 36] });

function MapRefresher() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 500); }, [map]);
  return null;
}

function MapEvents({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [fences, setFences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [alertData, setAlertData] = useState(null);
  const [lastClick, setLastClick] = useState(null);

  // --- Form States ---
  const [vNo, setVNo] = useState("");
  const [vDriver, setVDriver] = useState("");
  const [gName, setGName] = useState("");
  const [gCat, setGCat] = useState("restricted_zone");
  const [gCoords, setGCoords] = useState(""); // JSON format string for coordinates

  const fetchData = async () => {
    try {
      const [rF, rV, rH] = await Promise.all([
        axios.get(`${API}/geofences`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/violations/history`),
      ]);
      setFences(rF.data.geofences || []);
      setVehicles(rV.data.vehicles || []);
      setHistory(rH.data.violations || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchData();
    const ws = new WebSocket(API.replace("https", "wss") + "/ws/alerts");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setAlertData(data);
      setLogs((p) => [data, ...p]);
      fetchData();
    };
    return () => ws.close();
  }, []);

  const handleMapClick = (latlng) => {
    setLastClick(latlng);
    axios.post(`${API}/vehicles/location`, {
      vehicle_id: vehicles[0]?.vehicle_number || "TEST_V",
      latitude: latlng.lat,
      longitude: latlng.lng,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCreateGeofence = async () => {
    try {
      const parsedCoords = JSON.parse(gCoords);
      await axios.post(`${API}/geofences`, {
        name: gName,
        category: gCat,
        coordinates: parsedCoords
      });
      alert("Geofence Created!");
      setGName(""); setGCoords("");
      fetchData();
    } catch (e) { alert("Invalid Coordinate JSON format!"); }
  };

  const getFenceColor = (cat) => {
    if (cat === 'restricted_zone') return "#f85149";
    if (cat === 'delivery_zone') return "#3fb950";
    return "#d29922";
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    root: { height:"100vh", display:"flex", flexDirection:"column", background:"#0d1117", color:"#e6edf3", fontFamily:"system-ui" },
    nav: { background:"#161b22", borderBottom:"1px solid #30363d", padding:"0 20px", display:"flex", alignItems:"center", height:56 },
    tab: (a) => ({ background:"none", border:"none", cursor:"pointer", padding:"0 12px", fontSize:12, fontWeight:600, color:a?"#58a6ff":"#8b949e", borderBottom:a?"2px solid #58a6ff":"none", height:"100%" }),
    card: { background:"#161b22", border:"1px solid #30363d", borderRadius:8, overflow:"hidden", padding:15 },
    inp: { background:"#0d1117", border:"1px solid #30363d", borderRadius:6, color:"#fff", padding:8, width:"100%", marginBottom:10, fontSize:13 },
    btn: { background:"#238636", color:"#fff", border:"none", padding:"10px 16px", borderRadius:6, cursor:"pointer", fontWeight:600, width:"100%" }
  };

  return (
    <div style={S.root}>
      <nav style={S.nav}>
        <span style={{ fontWeight: 800, marginRight: 20, fontSize:14 }}>GEOFENCE <span style={{color:"#58a6ff"}}>PRO</span></span>
        {["Dashboard", "Vehicles", "Geofences", "History"].map((t, i) => (
          <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </nav>

      <div style={{ padding: 20, flexGrow: 1, overflowY: "auto" }}>
        
        {/* ═══ TAB 0: DASHBOARD ═══ */}
        {tab === 0 && (
          <div style={{ display: "flex", gap: 20, height: "80vh" }}>
            <div style={{ flex: 2, ...S.card, padding:0, position: "relative" }}>
              <MapContainer center={[28.61, 77.23]} zoom={11} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <MapRefresher />
                <MapEvents onMapClick={handleMapClick} />
                {fences.map((f, i) => (
                  <Polygon key={i} positions={(f.coordinates?.coordinates?.[0] || []).map(p => [p[1], p[0]])} 
                    pathOptions={{ color: getFenceColor(f.category), fillOpacity: 0.2 }} 
                  >
                    <Popup><b>{f.name}</b><br/>Type: {f.category}</Popup>
                  </Polygon>
                ))}
                {lastClick && <Marker position={lastClick} icon={customIcon}><Popup>Vehicle Signal</Popup></Marker>}
              </MapContainer>
            </div>
            <div style={{ flex: 1, display:"flex", flexDirection:"column", gap:15 }}>
              <div style={{ ...S.card, flexGrow: 1 }}>
                <h4 style={{margin:"0 0 10px 0", fontSize:13}}>LIVE BREACH LOGS</h4>
                {logs.map((l, i) => (
                  <div key={i} style={{padding:8, background:"#f8514915", borderRadius:6, marginBottom:8, borderLeft:"3px solid #f85149", fontSize:12}}>
                    <b>{l.vehicle?.vehicle_id}</b> <br/> {l.geofence?.geofence_name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 1: VEHICLES ═══ */}
        {tab === 1 && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ width: 300, ...S.card }}>
              <h3>Register Vehicle</h3>
              <input style={S.inp} placeholder="Vehicle No (KA-01...)" value={vNo} onChange={e=>setVNo(e.target.value)} />
              <input style={S.inp} placeholder="Driver Name" value={vDriver} onChange={e=>setVDriver(e.target.value)} />
              <button style={S.btn} onClick={async () => {
                await axios.post(`${API}/vehicles`, { vehicle_number: vNo, driver_name: vDriver });
                setVNo(""); setVDriver(""); fetchData();
              }}>Save Vehicle</button>
            </div>
            <div style={{ flexGrow: 1, ...S.card }}>
              <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
                <thead><tr style={{textAlign:"left", borderBottom:"1px solid #30363d"}}><th style={{padding:12}}>Vehicle No</th><th style={{padding:12}}>Driver</th></tr></thead>
                <tbody>{vehicles.map((v, i) => (<tr key={i}><td style={{padding:12, borderBottom:"1px solid #21262d"}}>{v.vehicle_number}</td><td style={{padding:12, borderBottom:"1px solid #21262d"}}>{v.driver_name}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: GEOFENCE MANAGEMENT (NEW) ═══ */}
        {tab === 2 && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ width: 350, ...S.card }}>
              <h3>Create Geofence</h3>
              <input style={S.inp} placeholder="Zone Name" value={gName} onChange={e=>setGName(e.target.value)} />
              <select style={S.inp} value={gCat} onChange={e=>setGCat(e.target.value)}>
                <option value="restricted_zone">Restricted Zone</option>
                <option value="delivery_zone">Delivery Zone</option>
                <option value="customer_area">Customer Area</option>
              </select>
              <textarea style={{...S.inp, height:100}} placeholder='Coordinates Array: [[lat, lng], [lat, lng]...]' value={gCoords} onChange={e=>setGCoords(e.target.value)} />
              <button style={S.btn} onClick={handleCreateGeofence}>Create Zone</button>
            </div>
            <div style={{ flexGrow: 1, ...S.card }}>
               <h4>Active Zones</h4>
               {fences.map((f, i) => (
                 <div key={i} style={{padding:10, borderBottom:"1px solid #30363d", display:"flex", justifyContent:"space-between"}}>
                    <span>{f.name}</span>
                    <span style={{color:getFenceColor(f.category), fontSize:11}}>{f.category.toUpperCase()}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 3: HISTORY ═══ */}
        {tab === 3 && (
          <div style={S.card}>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
                <thead><tr style={{textAlign:"left", borderBottom:"1px solid #30363d"}}><th style={{padding:12}}>Time</th><th style={{padding:12}}>Vehicle</th><th style={{padding:12}}>Zone</th></tr></thead>
                <tbody>{history.map((h, i) => (<tr key={i}><td style={{padding:12, borderBottom:"1px solid #21262d"}}>{new Date(h.timestamp).toLocaleString()}</td><td style={{padding:12, borderBottom:"1px solid #21262d"}}>{h.vehicle?.vehicle_id}</td><td style={{padding:12, borderBottom:"1px solid #21262d"}}>{h.geofence?.geofence_name}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>

      {alertData && (
        <div style={{ position:"fixed", top:20, right:20, background:"#f85149", color:"white", padding:"15px 25px", borderRadius:8, fontWeight:700, zIndex:10000 }}>
          🚨 GEOFENCE BREACH: {alertData.vehicle?.vehicle_id}
        </div>
      )}
    </div>
  );
}