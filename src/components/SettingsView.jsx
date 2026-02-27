import React, { useState } from 'react';
import { Settings, Bell, Palette, Map, User, X, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { setUserProfile } from '../firebase/services';

export default function SettingsView({ appSettings, setAppSettings, user, setUser }) {
    const { notifications, darkMode, mapEngine } = appSettings;
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ username: user?.username || '' });
    const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

    const updateSetting = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    // Password change once per week — stored in localStorage
    const lastPwChange = parseInt(localStorage.getItem('urbansafe_last_pw_change') || '0');
    const WEEK_MS = 7 * 24 * 3600000;
    const canChangePassword = (Date.now() - lastPwChange) >= WEEK_MS || lastPwChange === 0;
    const nextPwChangeDate = canChangePassword ? null : new Date(lastPwChange + WEEK_MS).toLocaleDateString();

    const handleSaveProfile = async () => {
        if (!profileForm.username.trim()) { setProfileMsg({ type: 'err', text: 'Username cannot be empty.' }); return; }
        const newUsername = profileForm.username.trim();

        // Push update to Firebase
        if (user?.uid) {
            try {
                await setUserProfile(user.uid, { username: newUsername });
                setUser(prev => ({ ...prev, username: newUsername }));
                setProfileMsg({ type: 'ok', text: 'Username updated successfully!' });
            } catch (err) {
                console.error("Failed to update profile:", err);
                setProfileMsg({ type: 'err', text: 'Failed to update profile.' });
            }
        } else {
            // Guest fallback
            setUser(prev => ({ ...prev, username: newUsername }));
            setProfileMsg({ type: 'ok', text: 'Username updated successfully!' });
        }

        setTimeout(() => setProfileMsg({ type: '', text: '' }), 2500);
    };

    const handleChangePassword = () => {
        const { newPassword, confirmPassword } = pwForm;
        if (!newPassword || !confirmPassword) { setPwMsg({ type: 'err', text: 'Please fill in both password fields.' }); return; }
        if (newPassword.length < 6) { setPwMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return; }
        if (newPassword !== confirmPassword) { setPwMsg({ type: 'err', text: "Passwords don't match." }); return; }
        if (!canChangePassword) { setPwMsg({ type: 'err', text: `You can change your password again on ${nextPwChangeDate}.` }); return; }

        // Password change through Firebase Auth is usually handled separately, 
        // but for now we'll just show a message or use the updatePassword method if available.
        setPwMsg({ type: 'err', text: 'Password changes are managed via email / auth provider.' });
        setTimeout(() => setPwMsg({ type: '', text: '' }), 2500);
    };

    const SettingItem = ({ icon: Icon, title, description, children }) => (
        <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="setting-icon-box" style={{ padding: '10px', borderRadius: '12px', color: 'var(--accent-orange)' }}>
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

    const Toggle = ({ value, onToggle }) => (
        <div onClick={onToggle} style={{ width: 44, height: 24, background: value ? 'var(--accent-orange)' : 'var(--toggle-inactive)', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'all 0.3s' }} />
        </div>
    );

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)', borderRadius: 10, color: 'var(--text-primary)',
        fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <>
            <div className="settings-view-container" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)', width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <Settings size={28} className="icon-glow" />
                    <h2 style={{ margin: 0 }}>Application Settings</h2>
                </div>

                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Preference</h3>
                    <SettingItem icon={Bell} title="Push Notifications" description="Receive alerts for high-severity incidents in your area.">
                        <Toggle value={notifications} onToggle={() => updateSetting('notifications', !notifications)} />
                    </SettingItem>
                    <SettingItem icon={Palette} title="Dark Mode" description="Toggle between light and dark theme aesthetics.">
                        <Toggle value={darkMode} onToggle={() => updateSetting('darkMode', !darkMode)} />
                    </SettingItem>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Account & Privacy</h3>
                    <SettingItem icon={User} title="Profile Settings" description={user ? `Logged in as ${user.username}` : 'Manage your display name and avatar.'}>
                        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}
                            onClick={() => { setProfileForm({ username: user?.username || '' }); setShowProfileModal(true); }}>
                            Edit
                        </button>
                    </SettingItem>
                </section>

                <section>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '16px' }}>System</h3>
                    <SettingItem icon={Map} title="Enable Satellite View" description={`Enables Satellite for aerial view.`}>
                        <Toggle
                            value={mapEngine === 'satellite'}
                            onToggle={() => updateSetting('mapEngine', mapEngine === 'satellite' ? 'google' : 'satellite')}
                        />
                    </SettingItem>
                    {mapEngine === 'satellite' && (
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: -6, marginBottom: 12, paddingLeft: 8 }}>
                            Satellite Hybrid mode active — aerial imagery + road labels.
                        </p>
                    )}
                </section>
            </div>

            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowProfileModal(false)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 22, width: 440, maxWidth: '95vw', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 18px', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Profile Settings</h3>
                            <button onClick={() => setShowProfileModal(false)} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '22px 24px' }}>
                            {/* Username section */}
                            <div style={{ marginBottom: 28 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 12 }}>Display Name</p>
                                {user?.loginMethod === 'google' && (
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>Google</span>
                                        Connected — default name from Google account
                                    </p>
                                )}
                                <input
                                    value={profileForm.username}
                                    onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
                                    placeholder="Enter username"
                                    maxLength={30}
                                    style={inputStyle}
                                />
                                {profileMsg.text && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, fontSize: 13, color: profileMsg.type === 'ok' ? '#80ffd4' : '#ff8080' }}>
                                        {profileMsg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                        {profileMsg.text}
                                    </div>
                                )}
                                <button className="btn-orange" style={{ marginTop: 14, gap: 7 }} onClick={handleSaveProfile} disabled={!user}>
                                    Save Username
                                </button>
                            </div>

                            {/* Password section */}
                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Change Password</p>
                                    {!canChangePassword && (
                                        <span style={{ fontSize: 11, color: '#ffb380', background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 6, padding: '2px 8px' }}>
                                            Available: {nextPwChangeDate}
                                        </span>
                                    )}
                                </div>
                                {user?.loginMethod === 'google' && (
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Password change is not available for Google accounts.</p>
                                )}
                                {user?.loginMethod !== 'google' && (
                                    <>
                                        <div style={{ position: 'relative', marginBottom: 10 }}>
                                            <input
                                                placeholder="New password"
                                                type={showNewPw ? 'text' : 'password'}
                                                value={pwForm.newPassword}
                                                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                                                style={{ ...inputStyle, paddingRight: 40 }}
                                                disabled={!canChangePassword || !user}
                                            />
                                            <button type="button" onClick={() => setShowNewPw(p => !p)}
                                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', all: 'unset', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: 12 }}>
                                            <input
                                                placeholder="Confirm new password"
                                                type={showConfirmPw ? 'text' : 'password'}
                                                value={pwForm.confirmPassword}
                                                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                                style={{ ...inputStyle, paddingRight: 40 }}
                                                disabled={!canChangePassword || !user}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', all: 'unset', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {pwMsg.text && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 13, color: pwMsg.type === 'ok' ? '#80ffd4' : '#ff8080' }}>
                                                {pwMsg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                {pwMsg.text}
                                            </div>
                                        )}
                                        <button
                                            className={canChangePassword && user ? 'btn-orange' : 'btn-ghost'}
                                            style={{ gap: 7 }}
                                            onClick={handleChangePassword}
                                            disabled={!canChangePassword || !user}
                                        >
                                            <Lock size={14} /> Change Password
                                        </button>
                                    </>
                                )}
                                {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Log in to change your password.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
