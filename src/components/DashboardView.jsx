import React, { useMemo } from 'react';
import ReportsPanel from './ReportsPanel';
import MapView from './MapView';

export default function DashboardView({
    publicReports,
    communityPosts = [],
    handleReportClick,
    isLoaded,
    onLoad,
    onUnmount,
    onMapClick,
    selectedLocation,
    selectedReportId,
    userLocation,
    mapCenter,
    onCenterChanged,
    map,
    mapEngine,
    darkMode,
    onViewOnMap,
    user
}) {
    // Normalise community incidents (pinned to map) into the same shape as
    // regular reports so MapView can render their circle zones.
    const communityIncidents = useMemo(() =>
        communityPosts
            .filter(p => p.type === 'incident' && p.location)
            .map(p => ({
                id: `comm-${p.id}`,
                linkedReportId: p.linkedReportId,
                location: p.location,
                radius: p.severity === 'high' ? 350 : p.severity === 'medium' ? 250 : 150,
                severity: p.severity || 'medium',
                title: p.content?.slice(0, 60) || 'Community Incident',
                description: p.content || '',
                areaName: p.communityName || 'Community',
                communityColor: p.communityColor,
                isCommunityIncident: true,
                isClassifying: false,
                isFake: false,
            })),
        [communityPosts]
    );

    // Combined list: public map reports + community incidents, deduped to 1 circle per incident
    const mapReports = useMemo(() => {
        const result = [...publicReports];
        const seenIds = new Set(publicReports.map(r => r.id));

        for (const p of communityIncidents) {
            const trackId = p.linkedReportId || p.id;
            if (!seenIds.has(trackId)) {
                seenIds.add(trackId);
                result.push(p);
            }
        }
        return result;
    }, [publicReports, communityIncidents]);

    return (
        <>
            <ReportsPanel
                reportList={publicReports}
                communityPosts={communityPosts}
                onReportClick={handleReportClick}
                onViewOnMap={onViewOnMap}
                user={user}
            />
            <MapView
                isLoaded={isLoaded}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onMapClick={onMapClick}
                reportList={mapReports}
                selectedLocation={selectedLocation}
                selectedReportId={selectedReportId}
                userLocation={userLocation}
                mapCenter={mapCenter}
                onCenterChanged={onCenterChanged}
                map={map}
                mapEngine={mapEngine}
                darkMode={darkMode}
            />
        </>
    );
}
