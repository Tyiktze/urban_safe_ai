import React, { useState, useRef, useEffect } from 'react';
import { Menu, LayoutGrid, Users, Clock, Settings, LogOut, LogIn, User, ChevronRight } from 'lucide-react';

export default function Sidebar({ onToggle, isOpen, activeTab, onTabChange, user, onOpenAuth, onLogout, joinedCommunities = [], allCommunities = [] }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef(null);

    const tabs = [
        { id: 'grid', icon: LayoutGrid, label: 'Dashboard' },
        { id: 'history', icon: Clock, label: 'History' },
        { id: 'users', icon: Users, label: 'Community' },
    ];

    // Close menu when clicking outside
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const avatarSeed = user?.username || 'Felix';
    const avatarSrc = user?.loginMethod === 'google'
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
        : `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=ff6b35&textColor=ffffff`;

    // Resolve which communities the user has joined using joinedCommunities prop
    // joinedCommunities may be community objects or plain IDs — handle both
    const myCommunities = React.useMemo(() => {
        if (!user) return [];
        if (joinedCommunities.length === 0) return [];
        // If they are objects with a name field, use directly
        if (typeof joinedCommunities[0] === 'object' && joinedCommunities[0]?.name) {
            return joinedCommunities;
        }
        // If they are IDs, resolve against allCommunities
        const idSet = new Set(joinedCommunities);
        return allCommunities.filter(c => idSet.has(c.id));
    }, [joinedCommunities, allCommunities, user]);

    return (
        <>
            <button
                className={`floating-sidebar-toggle ${!isOpen ? 'visible' : ''}`}
                onClick={onToggle}
                title="Open Sidebar"
            >
                <Menu size={20} />
            </button>
            <aside className={`sidebar glass ${!isOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-icon" onClick={onToggle} title="Collapse">
                    <Menu size={20} />
                </div>

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <div
                            key={tab.id}
                            className={`sidebar-icon ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            title={tab.label}
                        >
                            <Icon size={20} />
                        </div>
                    );
                })}

                <div className="sidebar-bottom">
                    <div
                        className={`sidebar-icon ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => onTabChange('settings')}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </div>

                    {/* Profile picture with dropdown */}
                    <div ref={menuRef} style={{ position: 'relative' }}>
                        <img
                            src={user ? avatarSrc : 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'}
                            alt="Profile"
                            className="profile-img"
                            style={{ cursor: 'pointer', opacity: user ? 1 : 0.5, transition: 'opacity 0.2s, transform 0.2s', transform: showProfileMenu ? 'scale(1.1)' : 'scale(1)' }}
                            onClick={() => setShowProfileMenu(p => !p)}
                            title={user ? user.username : 'Log in'}
                        />

                        {showProfileMenu && (
                            <div style={{
                                position: 'absolute', bottom: '0', left: '100%', marginLeft: '12px',
                                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                                borderRadius: 14, padding: '8px', minWidth: 220,
                                boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 9999,
                            }}>
                                {user ? (
                                    <>
                                        {/* User info */}
                                        <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--glass-border)', marginBottom: 6 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{user.username}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user.email}</div>
                                            {user.uid && (
                                                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'monospace', letterSpacing: '0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    ID: {user.uid}
                                                </div>
                                            )}
                                        </div>

                                        {/* Communities section */}
                                        <div style={{ padding: '6px 12px 8px', borderBottom: '1px solid var(--glass-border)', marginBottom: 6 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 7 }}>
                                                My Communities
                                            </div>
                                            {myCommunities.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    {myCommunities.slice(0, 5).map(c => (
                                                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{
                                                                width: 8, height: 8, borderRadius: '50%',
                                                                background: c.color || 'var(--accent-orange)',
                                                                flexShrink: 0,
                                                                boxShadow: `0 0 5px ${c.color || 'var(--accent-orange)'}88`
                                                            }} />
                                                            <span style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {c.name}
                                                            </span>
                                                            {c.isPrivate && (
                                                                <span style={{ fontSize: 9, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>Private</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {myCommunities.length > 5 && (
                                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 16 }}>
                                                            +{myCommunities.length - 5} more…
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    <Users size={13} style={{ opacity: 0.5 }} />
                                                    Not in any community yet
                                                </div>
                                            )}
                                            <button
                                                onClick={() => { setShowProfileMenu(false); onTabChange('users'); }}
                                                style={{ all: 'unset', cursor: 'pointer', marginTop: 8, fontSize: 11, color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <ChevronRight size={11} /> Browse communities
                                            </button>
                                        </div>

                                        <button onClick={() => { setShowProfileMenu(false); onTabChange('settings'); }}
                                            style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer', borderRadius: 9, width: '100%', boxSizing: 'border-box', fontSize: 13, color: 'var(--text-primary)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <User size={14} /> Profile Settings
                                        </button>
                                        <button onClick={() => { setShowProfileMenu(false); onLogout(); }}
                                            style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer', borderRadius: 9, width: '100%', boxSizing: 'border-box', fontSize: 13, color: '#ff8080', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(238,66,102,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <LogOut size={14} /> Log Out
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { setShowProfileMenu(false); onOpenAuth(); }}
                                        style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', cursor: 'pointer', borderRadius: 10, width: '100%', boxSizing: 'border-box', fontSize: 13, color: 'var(--accent-orange)', fontWeight: 600, transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,53,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <LogIn size={14} /> Log In / Sign Up
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

