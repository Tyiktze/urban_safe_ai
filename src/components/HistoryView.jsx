import React from 'react';
import ReportsPanel from './ReportsPanel';
import MapView from './MapView';

export default function HistoryView({
    userReports,
    handleReportClick,
    handleDeleteReport,
    handleSolveReport,
    handleEditReport,
    isLoaded,
    onLoad,
    onUnmount,
    onMapClick,
    historyMapReports,
    selectedLocation,
    selectedReportId,
    userLocation,
    mapCenter,
    onCenterChanged,
    map,
    mapEngine,
    darkMode,
    user
}) {
    return (
        <div className="history-expanded-view">
            <ReportsPanel
                reportList={userReports}
                onReportClick={handleReportClick}
                onDelete={handleDeleteReport}
                onSolve={handleSolveReport}
                onEdit={handleEditReport}
                isHistoryView={true}
                userLocation={userLocation}
                user={user}
            />
            <div className="history-stats-sidebar glass">
                <h3>Impact Summary</h3>
                <div className="stat-card">
                    <span className="stat-value">{userReports.length}</span>
                    <span className="stat-label">Total Reports</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{userReports.filter(r => r.isSolved).length}</span>
                    <span className="stat-label">Solved</span>
                </div>

                <div className="mini-map-container glass">
                    <MapView
                        isLoaded={isLoaded}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onMapClick={onMapClick}
                        reportList={historyMapReports}
                        selectedLocation={selectedLocation}
                        selectedReportId={selectedReportId}
                        userLocation={userLocation}
                        mapCenter={mapCenter}
                        onCenterChanged={onCenterChanged}
                        map={map}
                        isMini={true}
                        mapEngine={mapEngine}
                        darkMode={darkMode}
                    />
                </div>
            </div>
        </div>
    );
}
