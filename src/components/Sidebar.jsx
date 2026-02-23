import React from 'react';
import { Menu, LayoutGrid, Users, Clock, Settings } from 'lucide-react';

export default function Sidebar({ onToggle, isOpen, activeTab, onTabChange }) {
    const tabs = [
        { id: 'grid', icon: LayoutGrid },
        { id: 'users', icon: Users },
        { id: 'history', icon: Clock },
    ];

    return (
        <>
            <button
                className={`floating-sidebar-toggle ${!isOpen ? 'visible' : ''}`}
                onClick={onToggle}
            >
                <Menu size={20} />
            </button>
            <aside className={`sidebar glass ${!isOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-icon" onClick={onToggle}>
                    <Menu size={20} />
                </div>

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <div
                            key={tab.id}
                            className={`sidebar-icon ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon size={20} />
                        </div>
                    );
                })}

                <div className="sidebar-bottom">
                    <div className="sidebar-icon" onClick={() => onTabChange('settings')}>
                        <Settings size={20} />
                    </div>
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="Profile"
                        className="profile-img"
                    />
                </div>
            </aside>
        </>
    );
}
