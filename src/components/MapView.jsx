import React, { useState, useMemo, useCallback } from 'react';
import { GoogleMap, MarkerF, PolygonF, InfoWindowF } from '@react-google-maps/api';
import { Navigation, Plus, Minus } from 'lucide-react';
import polygonClipping from 'polygon-clipping';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const EARTH_R = 6_371_000;
const DEG2RAD = Math.PI / 180;
const containerStyle = { width: '100%', height: '100%' };

const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#121319' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#747474' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#121319' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2126' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1c22' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1115' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];

const SEVERITY_STYLES = {
    high: { fillColor: '#EE4266', strokeColor: '#EE4266', fillOpacity: 0.45, strokeWeight: 2, strokeOpacity: 0.9 },
    medium: { fillColor: '#FF6B35', strokeColor: '#FF6B35', fillOpacity: 0.40, strokeWeight: 2, strokeOpacity: 0.8 },
    low: { fillColor: '#51DEA1', strokeColor: '#51DEA1', fillOpacity: 0.35, strokeWeight: 1, strokeOpacity: 0.7 },
};

// ─────────────────────────────────────────────────────────────────────────────
// FLAT-SPACE PROJECTION
// All geometry runs in metres. Each circle uses its own centre as origin
// so floating-point values stay small and maximally accurate.
// ─────────────────────────────────────────────────────────────────────────────
function project(lat, lng, refLat, refLng) {
    return [
        EARTH_R * (lng - refLng) * DEG2RAD * Math.cos(refLat * DEG2RAD),
        EARTH_R * (lat - refLat) * DEG2RAD,
    ];
}

function unproject(x, y, refLat, refLng) {
    return {
        lat: refLat + (y / EARTH_R) / DEG2RAD,
        lng: refLng + (x / EARTH_R) / DEG2RAD / Math.cos(refLat * DEG2RAD),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCLE POLYGON  (polygon-clipping Polygon format)
// Ring = [[lng,lat], …, [lng,lat]]  closed (last === first)
// ─────────────────────────────────────────────────────────────────────────────
function circleResolution(r) {
    return Math.max(64, Math.min(256, Math.ceil(2 * Math.PI * r / 4)));
}

function makeCirclePoly(cx, cy, r, refLat, refLng) {
    const n = circleResolution(r);
    const ring = new Array(n + 1);
    for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n;
        const { lat, lng } = unproject(cx + r * Math.cos(a), cy + r * Math.sin(a), refLat, refLng);
        ring[i] = [lng, lat];
    }
    ring[n] = ring[0];
    return [ring]; // → Polygon
}

// ─────────────────────────────────────────────────────────────────────────────
// RADICAL-AXIS HALF-PLANE POLYGON
// ─────────────────────────────────────────────────────────────────────────────
function makeRadicalAxisHalfPlane(cx, cy, r, ox, oy, ro, refLat, refLng) {
    const dx = ox - cx, dy = oy - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-9) return null;

    // Distance from centre A along A→B to the radical axis
    const h = (d * d + r * r - ro * ro) / (2 * d);
    const mx = cx + (h / d) * dx;
    const my = cy + (h / d) * dy;
    const px = -dy / d, py = dx / d;
    const bx = -dx / d, by = -dy / d;
    const BIG = (r + ro + d) * 2;

    const flatPts = [
        [mx + px * BIG, my + py * BIG],
        [mx - px * BIG, my - py * BIG],
        [mx - px * BIG + bx * BIG, my - py * BIG + by * BIG],
        [mx + px * BIG + bx * BIG, my + py * BIG + by * BIG],
    ];

    const ring = flatPts.map(([x, y]) => {
        const { lat, lng } = unproject(x, y, refLat, refLng);
        return [lng, lat];
    });
    ring.push(ring[0]);
    return [ring];
}

function relation(d, rA, rB) {
    if (d >= rA + rB) return 'none';
    if (d + rB <= rA) return 'AcontainsB';
    if (d + rA <= rB) return 'BcontainsA';
    return 'partial';
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE BOOLEAN OPS
// ─────────────────────────────────────────────────────────────────────────────
function safeIntersect(poly, mask) {
    if (!mask) return [poly];
    try {
        const r = polygonClipping.intersection([poly], [mask]);
        return r.length > 0 ? r : [];
    } catch (e) { console.warn('[zones] intersect:', e); return [poly]; }
}

function safeDiff(poly, clipMulti) {
    if (!clipMulti || clipMulti.length === 0) return [poly];
    try {
        const r = polygonClipping.difference([poly], clipMulti);
        return r.length > 0 ? r : [];
    } catch (e) { console.warn('[zones] diff:', e); return [poly]; }
}

function safeUnion(polys) {
    if (!polys || polys.length === 0) return [];
    if (polys.length === 1) return [polys[0]];
    try { return polygonClipping.union(...polys); }
    catch (e) { console.warn('[zones] union:', e); return [polys[0]]; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
function computeZones(reportList, isSmartView) {
    const active = reportList.filter(r => r.location && !r.isClassifying && !r.isFake);
    if (active.length === 0) return [];

    const refLat = active.reduce((s, r) => s + r.location.lat, 0) / active.length;
    const refLng = active.reduce((s, r) => s + r.location.lng, 0) / active.length;

    const sites = active.map(r => {
        const [cx, cy] = project(r.location.lat, r.location.lng, refLat, refLng);
        const rad = r.radius || 250;
        return { r, cx, cy, rad, poly: makeCirclePoly(cx, cy, rad, refLat, refLng) };
    });

    if (!isSmartView) {
        // LEGACY: Full circles, simple overlap
        return sites.map((s, i) => ({
            id: `${s.r.id || i}`,
            report: s.r,
            sev: s.r.severity || 'low',
            paths: s.poly.map(ring => ring.map(([lng, lat]) => ({ lat, lng }))),
            isLegacy: true
        }));
    }

    // SMART: Radical Axis (All intersections, no overlapping)
    const output = [];
    for (let i = 0; i < sites.length; i++) {
        const A = sites[i];
        const halfPlanes = [];
        const holes = [];

        for (let j = 0; j < sites.length; j++) {
            if (j === i) continue;
            const B = sites[j];
            const dx = B.cx - A.cx, dy = B.cy - A.cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            const rel = relation(d, A.rad, B.rad);

            if (rel === 'none') continue;
            if (rel === 'partial') {
                const hp = makeRadicalAxisHalfPlane(A.cx, A.cy, A.rad, B.cx, B.cy, B.rad, refLat, refLng);
                if (hp) halfPlanes.push(hp);
            }
            if (rel === 'AcontainsB') holes.push(B.poly);
        }

        let territory = [A.poly];
        for (const hp of halfPlanes) {
            const next = [];
            for (const frag of territory) {
                next.push(...safeIntersect(frag, hp));
            }
            territory = next;
        }
        if (holes.length > 0 && territory.length > 0) {
            const holeUnion = safeUnion(holes);
            const next = [];
            for (const frag of territory) {
                next.push(...safeDiff(frag, holeUnion));
            }
            territory = next;
        }

        territory.forEach((polygon, fragIdx) => {
            output.push({
                id: `${A.r.id || i}-f${fragIdx}`,
                report: A.r,
                sev: A.r.severity || 'low',
                paths: polygon.map(ring => ring.map(([lng, lat]) => ({ lat, lng }))),
            });
        });
    }

    return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MapView({
    isLoaded, onLoad, onUnmount, onMapClick,
    reportList, selectedLocation, selectedReportId, userLocation, mapCenter, onCenterChanged, map,
    isMini = false, mapEngine = 'premium', darkMode = true
}) {
    // hoveredData stores: { reports: Report[], location: {lat,lng} }
    const [hoveredData, setHoveredData] = useState(null);

    // Synchronize hover state with selected report from sidebar
    React.useEffect(() => {
        if (selectedReportId && !isMini) {
            const report = reportList.find(r => r.id === selectedReportId);
            if (report && report.location) {
                setHoveredData({
                    reports: [report],
                    location: report.location
                });
            }
        }
    }, [selectedReportId, reportList, isMini]);
    const [viewMode, setViewMode] = useState('legacy'); // 'legacy' or 'smart'
    const hoverTimerRef = React.useRef(null);

    const zones = useMemo(() =>
        computeZones(reportList, viewMode === 'smart'),
        [reportList, viewMode]);

    const severityColor = sev =>
        sev === 'high' ? '#EE4266' : sev === 'medium' ? '#FF6B35' : '#51DEA1';

    const handlePolygonOut = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setHoveredData(null);
    }, []);

    const handlePolygonMove = useCallback((e, report) => {
        if (isMini) return;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        // Find all reports at this mouse position if in legacy mode
        let activeReports = [report];
        if (viewMode === 'legacy') {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            activeReports = reportList.filter(r => {
                if (!r.location) return false;
                const dx = (r.location.lng - lng) * DEG2RAD * EARTH_R * Math.cos(r.location.lat * DEG2RAD);
                const dy = (r.location.lat - lat) * DEG2RAD * EARTH_R;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return dist <= (r.radius || 250);
            });
        }

        hoverTimerRef.current = setTimeout(() => {
            setHoveredData({
                reports: activeReports,
                location: { lat: e.latLng.lat(), lng: e.latLng.lng() }
            });
        }, 1000); // 2 second delay as requested
    }, [viewMode, reportList]);

    const handlePolygonClick = useCallback((e) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (onMapClick) onMapClick(e);
    }, [onMapClick]);

    const handleMyLocation = useCallback(() => {
        if (map && userLocation) {
            map.panTo(userLocation);
            map.setZoom(15);
        }
    }, [map, userLocation]);

    const handleZoomIn = useCallback(() => {
        if (map) map.setZoom(map.getZoom() + 1);
    }, [map]);

    const handleZoomOut = useCallback(() => {
        if (map) map.setZoom(map.getZoom() - 1);
    }, [map]);

    const mapOptions = useMemo(() => {
        const base = { disableDefaultUI: true, zoomControl: false };
        if (mapEngine === 'satellite') {
            return { ...base, mapTypeId: 'hybrid' };
        }
        // Google Maps: dark style in dark mode, clean light style in light mode
        return darkMode
            ? { ...base, styles: mapStyle }       // dark
            : { ...base, styles: [] };             // light
    }, [mapEngine, darkMode]);

    // Dwell tracker for player pin
    React.useEffect(() => {
        if (!userLocation || !reportList.length) return;
        const timer = setTimeout(() => {
            const inside = reportList.filter(r => {
                if (!r.location) return false;
                const dx = (r.location.lng - userLocation.lng) * DEG2RAD * EARTH_R * Math.cos(r.location.lat * DEG2RAD);
                const dy = (r.location.lat - userLocation.lat) * DEG2RAD * EARTH_R;
                return Math.sqrt(dx * dx + dy * dy) <= (r.radius || 250);
            });
            if (inside.length > 0) {
                setHoveredData({ reports: inside, location: userLocation });
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [userLocation, reportList]);

    return (
        <section className={`main-view ${isMini ? 'mini-view' : 'glass'}`}>
            <div className="map-placeholder">
                {!isMini && (
                    <div className="map-header-row" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingRight: '16px', marginBottom: '16px'
                    }}>
                        <h2 className="map-header">Urban Safe AI Map</h2>

                        <div className="map-toggle-group" style={{
                            display: 'flex', gap: '4px',
                            padding: '4px', borderRadius: '12px'
                        }}>
                            <button
                                onClick={() => { setViewMode('legacy'); handlePolygonOut(); }}
                                className={`toggle-btn ${viewMode === 'legacy' ? 'active' : ''}`}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px', border: 'none',
                                    cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    background: viewMode === 'legacy' ? '#51DEA1' : 'transparent',
                                    color: viewMode === 'legacy' ? '#121319' : undefined
                                }}
                            > LEGACY </button>
                            <button
                                onClick={() => { setViewMode('smart'); handlePolygonOut(); }}
                                className={`toggle-btn ${viewMode === 'smart' ? 'active' : ''}`}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px', border: 'none',
                                    cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    background: viewMode === 'smart' ? '#51DEA1' : 'transparent',
                                    color: viewMode === 'smart' ? '#121319' : undefined
                                }}
                            > SMART </button>
                        </div>
                    </div>
                )}

                <div className="map-container-wrapper"
                    style={{ flex: 1, borderRadius: isMini ? '8px' : '16px', overflow: 'hidden', position: 'relative' }}>

                    {/* Floating Map Controls */}
                    {!isMini && (
                        <div className="map-controls-overlay">
                            <button onClick={handleMyLocation} title="My Location" className="map-control-btn">
                                <Navigation size={18} />
                            </button>
                            <div className="map-control-divider"></div>
                            <button onClick={handleZoomIn} title="Zoom In" className="map-control-btn">
                                <Plus size={18} />
                            </button>
                            <button onClick={handleZoomOut} title="Zoom Out" className="map-control-btn">
                                <Minus size={18} />
                            </button>
                        </div>
                    )}

                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle} center={mapCenter} zoom={14}
                            onLoad={onLoad} onUnmount={onUnmount} onClick={onMapClick}
                            onIdle={() => {
                                if (map && onCenterChanged) {
                                    const newCenter = map.getCenter().toJSON();
                                    onCenterChanged(newCenter);
                                }
                            }}
                            options={mapOptions}
                        >
                            {userLocation && (
                                <MarkerF position={userLocation} zIndex={999_999} icon={{
                                    url: 'https://www.svgrepo.com/show/202744/maps-and-flags-pin.svg',
                                    scaledSize: new window.google.maps.Size(40, 40),
                                }} />
                            )}

                            {zones.map(zone => (
                                <PolygonF
                                    key={zone.id}
                                    paths={zone.paths}
                                    options={{
                                        ...(SEVERITY_STYLES[zone.sev] || SEVERITY_STYLES.low),
                                        ...(zone.report.isSolved ? {
                                            fillColor: '#0EA5E9',
                                            strokeColor: '#0EA5E9',
                                            fillOpacity: 0.1,
                                            strokeWeight: 2,
                                            strokeOpacity: 0.8
                                        } : {}),
                                        zIndex: zone.isLegacy ? undefined : 10,
                                        clickable: true,
                                    }}
                                    onClick={handlePolygonClick}
                                    onMouseMove={(e) => handlePolygonMove(e, zone.report)}
                                    onMouseOut={handlePolygonOut}
                                />
                            ))}

                            {/* Solved Status Indicators (Blue Checkmarks) */}
                            {reportList.filter(r => r.isSolved && r.location && !r.isClassifying && !r.isFake).map(report => (
                                <MarkerF
                                    key={`solved-${report.id}`}
                                    position={report.location}
                                    zIndex={100}
                                    icon={{
                                        url: 'https://www.svgrepo.com/show/489600/check-circle.svg',
                                        scaledSize: new window.google.maps.Size(26, 26),
                                        anchor: new window.google.maps.Point(13, 13)
                                    }}
                                />
                            ))}

                            {hoveredData && !isMini && (
                                <InfoWindowF
                                    position={hoveredData.location}
                                    onCloseClick={handlePolygonOut}
                                    options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
                                >
                                    <div style={{
                                        color: '#1a1a1a', minWidth: 220, maxWidth: 280,
                                        maxHeight: 300, overflowY: 'auto', paddingRight: 8,
                                        fontFamily: 'inherit'
                                    }}>
                                        {hoveredData.reports.map((r, idx) => (
                                            <div key={r.id} style={{
                                                marginBottom: idx === hoveredData.reports.length - 1 ? 0 : 12,
                                                paddingBottom: idx === hoveredData.reports.length - 1 ? 0 : 12,
                                                borderBottom: idx === hoveredData.reports.length - 1 ? 'none' : '1px solid #eee'
                                            }}>
                                                {/* Community incident badge */}
                                                {r.isCommunityIncident && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                        color: r.communityColor || '#ff6b35',
                                                        marginBottom: 5, letterSpacing: '0.06em'
                                                    }}>
                                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.communityColor || '#ff6b35', display: 'inline-block', flexShrink: 0 }} />
                                                        {r.areaName} · Community Incident
                                                    </div>
                                                )}
                                                <h4 style={{ margin: '0 0 4px', fontSize: 13 }}>
                                                    {r.title || r.content?.slice(0, 60)}
                                                </h4>
                                                <p style={{ margin: 0, fontSize: 12 }}>
                                                    {r.description || r.content}
                                                </p>
                                                <div style={{
                                                    marginTop: 6, fontSize: 10, fontWeight: 'bold',
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    color: severityColor(r.severity),
                                                }}>
                                                    {r.severity} severity
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </InfoWindowF>
                            )}

                            {selectedLocation && (
                                <MarkerF position={selectedLocation}
                                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' }} />
                            )}
                        </GoogleMap>
                    ) : <div className="loading-map">Loading map…</div>}
                </div>
            </div>
        </section >
    );
}