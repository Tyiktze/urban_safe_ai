import React from 'react';
import { Users } from 'lucide-react';

export default function GroupsView() {
    return (
        <div className="groups-view-container glass" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px',
            color: 'var(--text-secondary)'
        }}>
            <Users size={64} style={{ opacity: 0.2 }} />
            <h2 style={{ margin: 0 }}>Community Groups</h2>
            <p style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold', color: 'var(--accent-orange)' }}>WIP</p>
        </div>
    );
}
