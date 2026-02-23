import React, { useState } from 'react';
import { Settings, Bell, Palette, Map, Shield, User } from 'lucide-react';

export default function SettingsView({ appSettings, setAppSettings }) {
    const { notifications, darkMode, mapEngine } = appSettings;

    const updateSetting = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    const SettingItem = ({ icon: Icon, title, description, children }) => (
        <div className="setting-item" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '12px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="setting-icon-box" style={{
                    padding: '10px',
                    borderRadius: '12px',
                    color: 'var(--accent-orange)'
                }}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{title}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{description}</p>
                </div>
            </div>
            {children}
        </div>
    );

    return (
        <div className="settings-view-container" style={{
            padding: '30px',
            maxWidth: '800px',
            margin: '0 auto',
            color: 'var(--text-primary)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Settings size={28} className="icon-glow" />
                <h2 style={{ margin: 0 }}>Application Settings</h2>
            </div>

            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Preference</h3>
                <SettingItem
                    icon={Bell}
                    title="Push Notifications"
                    description="Receive alerts for high-severity incidents in your area."
                >
                    <div
                        className={`toggle-switch ${notifications ? 'active' : ''}`}
                        onClick={() => updateSetting('notifications', !notifications)}
                        style={{
                            width: '44px',
                            height: '24px',
                            background: notifications ? 'var(--accent-orange)' : 'var(--toggle-inactive)',
                            borderRadius: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            width: '18px',
                            height: '18px',
                            background: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '3px',
                            left: notifications ? '23px' : '3px',
                            transition: 'all 0.3s'
                        }} />
                    </div>
                </SettingItem>

                <SettingItem
                    icon={Palette}
                    title="Dark Mode"
                    description="Toggle between light and dark theme aesthetics."
                >
                    <div
                        className={`toggle-switch ${darkMode ? 'active' : ''}`}
                        onClick={() => updateSetting('darkMode', !darkMode)}
                        style={{
                            width: '44px',
                            height: '24px',
                            background: darkMode ? 'var(--accent-orange)' : 'var(--toggle-inactive)',
                            borderRadius: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            width: '18px',
                            height: '18px',
                            background: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '3px',
                            left: darkMode ? '23px' : '3px',
                            transition: 'all 0.3s'
                        }} />
                    </div>
                </SettingItem>
            </section>

            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Account & Privacy</h3>
                <SettingItem
                    icon={User}
                    title="Profile Settings"
                    description="Manage your display name and avatar."
                >
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Edit</button>
                </SettingItem>
                <SettingItem
                    icon={Shield}
                    title="Privacy & Data"
                    description="Manage how your report data is shared and stored."
                >
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Review</button>
                </SettingItem>
            </section>

            <section>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>System</h3>
                <SettingItem
                    icon={Map}
                    title="Map Engine"
                    description="Switch between different map rendering provider styles."
                >
                    <select
                        value={mapEngine}
                        onChange={(e) => updateSetting('mapEngine', e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                    >
                        <option value="premium">Google Maps Premium</option>
                        <option value="styleB">OpenStreetMap (Style B)</option>
                        <option value="satellite">Satellite Hybrid</option>
                    </select>
                </SettingItem>
            </section>
        </div>
    );
}
