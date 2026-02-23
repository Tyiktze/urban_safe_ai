import React from 'react';
import ReportsPanel from './ReportsPanel';
import MapView from './MapView';

export default function DashboardView({
    publicReports,
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
    darkMode
}) {
    return (
        <>
            <ReportsPanel
                reportList={publicReports}
                onReportClick={handleReportClick}
            />
            <MapView
                isLoaded={isLoaded}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onMapClick={onMapClick}
                reportList={publicReports}
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
