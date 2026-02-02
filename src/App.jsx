import React, { useState } from 'react';
import {
  Shield,
  Search,
  Bell,
  Plus,
  LayoutGrid,
  Users,
  Clock,
  PieChart,
  Files,
  Settings,
  Menu,
  AlertTriangle,
  Droplets,
  Palette,
  MoreVertical,
  Trash2,
  Building2,
  Wind,
  Bus,
  Lightbulb,
  Upload,
  Cpu,
  MapPin
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import roadDamageImg from './assets/road_damage.png';
import floodingImg from './assets/flooding.png';
import graffitiImg from './assets/graffiti.png';

const reports = [
  {
    id: 1,
    title: 'Road Damage',
    description: 'Road damage in sixls continued enteringmo samy.',
    image: roadDamageImg,
    status: 'red',
    icon: <AlertTriangle size={14} className="status-red-icon" />
  },
  {
    id: 2,
    title: 'Flooding',
    description: 'Flooding and avars the wear to at shocking area.',
    image: floodingImg,
    status: 'green',
    icon: <Droplets size={14} className="status-green-icon" />
  },
  {
    id: 3,
    title: 'Graffiti',
    description: 'Graffitty media to mesantal and...',
    image: graffitiImg,
    status: 'orange',
    icon: <Palette size={14} />
  }
];

const categories = [
  { id: 'waste', label: 'Illegal dumping / waste', icon: <Trash2 size={16} /> },
  { id: 'flooding', label: 'Flooding', icon: <Droplets size={16} /> },
  { id: 'buildings', label: 'Unsafe buildings', icon: <Building2 size={16} /> },
  { id: 'road', label: 'Road damage', icon: <AlertTriangle size={16} /> },
  { id: 'pollution', label: 'Pollution (air/water)', icon: <Wind size={16} /> },
  { id: 'lighting', label: 'Poor lighting / unsafe areas', icon: <Lightbulb size={16} /> },
  { id: 'transport', label: 'Public transport issues', icon: <Bus size={16} /> },
];

const initialNotifications = [
  { id: 1, text: 'New report nearby: Road Damage', time: '2 mins ago', unread: true, icon: <AlertTriangle size={16} /> },
  { id: 2, text: 'Status update: Your report #1234 is fixed', time: '1 hour ago', unread: true, icon: <LayoutGrid size={16} /> },
  { id: 3, text: 'Community alert: Heavy rain expected', time: '5 hours ago', unread: false, icon: <Wind size={16} /> }
];

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121319" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#747474" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121319" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181d22" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e2126" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1c22" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#282c33" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f1115" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f1115" }] }
];

function App() {
  const [activeTab, setActiveTab] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportList, setReportList] = useState(reports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 'road',
    image: null
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "N/A",
    libraries: ['places']
  });

  const [map, setMap] = React.useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        map.panTo(location);
        map.setZoom(15);
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const onMapClick = React.useCallback((e) => {
    setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setIsModalOpen(true);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      title: categories.find(c => c.id === formData.category)?.label || 'New Incident',
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1544006659-f0273767c9c2?auto=format&fit=crop&q=80&w=400',
      status: 'orange',
      icon: <AlertTriangle size={14} />,
      location: selectedLocation
    };
    setReportList([newReport, ...reportList]);
    setIsModalOpen(false);
    setFormData({ description: '', category: 'road', image: null });
    setImagePreview(null);
    setSelectedLocation(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-icon">
          <Menu size={20} />
          <span className="sidebar-tooltip">Menu</span>
        </div>

        <div className="sidebar-icon active">
          <LayoutGrid size={20} />
          <span className="sidebar-tooltip">Dashboard</span>
        </div>
        <div className="sidebar-icon">
          <Users size={20} />
          <span className="sidebar-tooltip">Community</span>
        </div>
        <div className="sidebar-icon">
          <Clock size={20} />
          <span className="sidebar-tooltip">History</span>
        </div>
        <div className="sidebar-icon">
          <PieChart size={20} />
          <span className="sidebar-tooltip">Analytics</span>
        </div>
        <div className="sidebar-icon">
          <Files size={20} />
          <span className="sidebar-tooltip">Reports</span>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-icon">
            <Settings size={20} />
            <span className="sidebar-tooltip">Settings</span>
          </div>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Profile"
            className="profile-img"
          />
        </div>
      </aside>

      {/* Main Layout */}
      <main className="main-layout">
        {/* Header */}
        <header className="header">
          <div className="logo-group">
            <div className="logo-icon">
              <Shield size={18} fill="white" />
            </div>
            <h1 className="logo-text">Urban<span>Safe AI</span></h1>
          </div>

          <div className="search-container">
            <Search className="search-icon" size={18} />
            {isLoaded && (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  placeholder="Search reports, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Autocomplete>
            )}
            {!isLoaded && (
              <input
                type="text"
                placeholder="Search reports, locations..."
                disabled
              />
            )}
          </div>

          <div className="header-actions">
            <div className="action-btn" style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              <div className="notification-badge">{notifications.filter(n => n.unread).length}</div>
            </div>

            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <button className="mark-read-btn" onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}>
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                      <div className="notification-icon">
                        {notification.icon}
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">{notification.text}</p>
                        <p className="notification-time">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="create-btn" onClick={() => alert('Add new report')}>
              <Plus size={18} />
              <span>UrbanSafe</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {/* Recent Reports Panel */}
          <section className="reports-panel">
            <div className="panel-header">
              <h2>Recent Reports</h2>
            </div>

            <div className="reports-list">
              {reportList.map((report, index) => (
                <div
                  key={report.id}
                  className="report-card fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img src={report.image} alt={report.title} className="report-img" />
                  <div className="report-info">
                    <div className="report-title-row">
                      <div className="report-title">
                        <div className={`status-dot status-${report.status}`}></div>
                        <span>{report.title}</span>
                      </div>
                      <MoreVertical size={16} color="#666" />
                    </div>
                    <p className="report-desc">{report.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Main Dashboard / Map View */}
          <section className="main-view glass">
            <div className="map-placeholder">
              <div className="map-container-wrapper" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                      styles: mapStyle,
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    {/* Real Google Map Markers */}
                    {reportList.filter(r => r.location).map(report => (
                      <Marker
                        key={report.id}
                        position={report.location}
                        title={report.title}
                      />
                    ))}
                    {selectedLocation && (
                      <Marker
                        position={selectedLocation}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png"
                        }}
                      />
                    )}
                    <Marker position={{ lat: 40.7128, lng: -74.0060 }} />
                    <Marker position={{ lat: 40.7300, lng: -73.9900 }} />
                    <Marker position={{ lat: 40.7000, lng: -74.0100 }} />
                  </GoogleMap>
                ) : (
                  <div className="loading-map">Loading Maps...</div>
                )}
                <div className="map-overlay"></div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Reporting Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Report Incident</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Location: {selectedLocation?.lat.toFixed(4)}, {selectedLocation?.lng.toFixed(4)}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Category
                  <span className="ai-detect-badge">
                    <Cpu size={10} /> AI Ready
                  </span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell us what you see..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Evidence</label>
                <div
                  className="file-upload-btn"
                  onClick={() => document.getElementById('file-input').click()}
                  style={{ height: imagePreview ? '180px' : '100px', padding: '0', overflow: 'hidden' }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Upload Image(s)</span>
                    </>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', border: 'none', fontSize: '12px', marginTop: '8px', padding: '4px' }}
                    onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }}
                  >
                    Change Image
                  </button>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
