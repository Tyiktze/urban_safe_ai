import React from 'react';
import { Shield, Search, Bell, X, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';

export default function Header({
    isLoaded,
    onPlaceChanged,
    searchQuery,
    setSearchQuery,
    onAddReport,
    onShareToCommunity,
    notifications = [],
    setNotifications,
    onToggleSidebar,
    showNotificationsPref = true,
    darkMode = true
}) {
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showActionMenu, setShowActionMenu] = React.useState(false);
    const actionMenuRef = React.useRef(null);
    const unreadCount = notifications.filter(n => n.unread).length;

    const toggleNotifications = () => setShowNotifications(!showNotifications);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const markRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, unread: false } : n
        ));
    };

    const dismissNotif = (id, e) => {
        e.stopPropagation();
        setNotifications(notifications.filter(n => n.id !== id));
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handler = (e) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
                setShowActionMenu(false);
            }
        };
        if (showActionMenu) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showActionMenu]);

    const handleReportIncident = () => {
        setShowActionMenu(false);
        onAddReport();
    };

    const handleShareCommunity = () => {
        setShowActionMenu(false);
        if (onShareToCommunity) onShareToCommunity('community');
    };

    return (
        <header className="header">
            <div className="logo-group">
                <div className="logo-icon">
                    <Shield size={18} fill="white" />
                </div>
                <h1 className="logo-text">Urban<span>Safe AI</span></h1>
            </div>

            <div className="search-container" theme={darkMode ? 'dark' : 'light'}>
                {isLoaded ? (
                    <PlaceAutocomplete
                        onPlaceSelect={onPlaceChanged}
                        darkMode={darkMode}
                    />
                ) : (
                    <>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports, locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled
                        />
                    </>
                )}
            </div>

            <div className="header-actions">
                {showNotificationsPref && (
                    <div className="action-btn" style={{ position: 'relative' }} onClick={toggleNotifications}>
                        <Bell size={20} />
                        {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}

                        {showNotifications && (
                            <div className="notification-panel glass fade-in" onClick={(e) => e.stopPropagation()}>
                                <div className="panel-header-row">
                                    <h3>Notifications</h3>
                                    <button onClick={markAllRead}>Mark all read</button>
                                </div>
                                <div className="notification-list">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`notification-item ${n.unread ? 'unread' : ''} ${n.type || ''}`}
                                                onClick={() => markRead(n.id)}
                                            >
                                                <div className="notif-content-row">
                                                    <div className="notif-body">
                                                        <p className="notif-text">{n.text}</p>
                                                        <span className="notif-time">{n.time}</span>
                                                    </div>
                                                    <button
                                                        className="dismiss-btn"
                                                        onClick={(e) => dismissNotif(n.id, e)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-notif">No new notifications</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* UrbanSafe Action Button */}
                <div style={{ position: 'relative' }} ref={actionMenuRef}>
                    <button
                        className="create-btn"
                        onClick={() => setShowActionMenu(v => !v)}
                        id="urbansafe-action-btn"
                    >
                        <Shield size={16} />
                        <span>UrbanSafe</span>
                        <ChevronRight
                            size={14}
                            style={{
                                transform: showActionMenu ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                marginLeft: 2
                            }}
                        />
                    </button>

                    {showActionMenu && (
                        <div className="urbansafe-action-menu fade-in" onClick={e => e.stopPropagation()}>
                            <div className="action-menu-title">What would you like to do?</div>
                            <button
                                className="action-menu-item"
                                onClick={handleReportIncident}
                                id="action-report-incident"
                            >
                                <div className="action-menu-icon-wrap" style={{ background: 'rgba(238,66,102,0.15)', color: '#ff8080' }}>
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="action-menu-text">
                                    <span className="action-menu-label">Report Incident</span>
                                    <span className="action-menu-desc">Pin a hazard or issue on the map</span>
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                            </button>
                            <button
                                className="action-menu-item"
                                onClick={handleShareCommunity}
                                id="action-share-community"
                            >
                                <div className="action-menu-icon-wrap" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                                    <Users size={16} />
                                </div>
                                <div className="action-menu-text">
                                    <span className="action-menu-label">Share Safety Notice</span>
                                    <span className="action-menu-desc">Post an alert to your communities</span>
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
