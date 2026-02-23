import React from 'react';
import { Shield, Search, Bell, Plus, X, Menu } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';

export default function Header({
    isLoaded,
    onPlaceChanged,
    searchQuery,
    setSearchQuery,
    onAddReport,
    notifications = [],
    setNotifications,
    onToggleSidebar,
    showNotificationsPref = true,
    darkMode = true
}) {
    const [showNotifications, setShowNotifications] = React.useState(false);
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
                <button className="create-btn" onClick={onAddReport}>
                    <Plus size={18} />
                    <span>UrbanSafe</span>
                </button>
            </div>
        </header>
    );
}
