import React, { useState, useMemo, useEffect } from 'react';
import { Cpu, CheckCircle, Trash2, Edit3, Globe, FileText, AlertTriangle, MapPin, Clock, Flame, Users, Zap } from 'lucide-react';

const THREE_DAYS = 3 * 24 * 3600000;

const SEVERITY_COLORS = {
    high: { bg: 'rgba(238,66,102,0.15)', text: '#ff8080', border: 'rgba(238,66,102,0.4)' },
    medium: { bg: 'rgba(255,107,53,0.15)', text: '#ffb380', border: 'rgba(255,107,53,0.4)' },
    low: { bg: 'rgba(81,222,161,0.15)', text: '#80ffd4', border: 'rgba(81,222,161,0.4)' },
};

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ReportsPanel({
    reportList = [],
    communityPosts = [],
    onReportClick,
    onDelete,
    onSolve,
    onEdit,
    isHistoryView,
    onViewOnMap,
}) {
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'incidents' | 'notices'
    // Live time ticker — re-render every 30s so timeAgo() labels stay accurate
    const [, setTimeTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTimeTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, []);

    const FILTER_TABS = [
        { id: 'all', label: 'All', icon: Globe },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { id: 'notices', label: 'Notices', icon: FileText },
    ];

    // Shared timestamp extractor for both report types
    const getTime = r => r.timestamp || (r.createdAt ? new Date(r.createdAt).getTime() : 0);

    const mergedItems = useMemo(() => {
        const incidentItems = reportList.map(r => ({ ...r, _itemType: 'incident' }));
        const noticeItems = communityPosts
            .filter(p => (Date.now() - (p.timestamp || 0)) < THREE_DAYS)
            .map(p => ({ ...p, _itemType: p.type === 'incident' ? 'incident' : 'notice' }));

        const allItems = [...incidentItems, ...noticeItems].sort((a, b) => getTime(b) - getTime(a));

        // Deduplicate incidents that were shared to multiple communities / public map
        const seenMapIncidents = new Set();
        return allItems.filter(item => {
            if (item._itemType === 'incident') {
                // For community posts that are incidents, track by their source report ID
                const trackId = item.linkedReportId || item.id;
                if (seenMapIncidents.has(trackId)) return false;
                seenMapIncidents.add(trackId);
            }
            return true;
        });
    }, [reportList, communityPosts]);

    const filteredItems = useMemo(() => {
        if (activeFilter === 'incidents') return mergedItems.filter(i => i._itemType === 'incident');
        if (activeFilter === 'notices') return mergedItems.filter(i => i._itemType === 'notice');
        return mergedItems;
    }, [mergedItems, activeFilter]);

    return (
        <section className="reports-panel">
            <div className="panel-header">
                <h2>{isHistoryView ? 'My Report History' : 'Recent Reports'}</h2>
            </div>

            {/* Filter tabs — only show on dashboard (not history) */}
            {!isHistoryView && (
                <div style={{ display: 'flex', gap: 6, padding: '0 0 14px', flexWrap: 'wrap' }}>
                    {FILTER_TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`feed-filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
                                style={{ fontSize: 11.5, padding: '6px 12px' }}
                                onClick={() => setActiveFilter(tab.id)}
                            >
                                <Icon size={12} /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="reports-list">
                {/* History view: classic report cards — sorted newest first */}
                {isHistoryView && [...reportList].sort((a, b) => getTime(b) - getTime(a)).map((report, index) => (
                    <div
                        key={report.id}
                        className={`report-card fade-in ${report.isFake ? 'is-fake' : ''} ${report.isClassifying ? 'is-validating' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => !report.isClassifying && onReportClick(report)}
                    >
                        {report.image && <img src={report.image} alt={report.title} className="report-img" />}
                        <div className="report-info">
                            <div className="report-title-row">
                                <div className="report-title">
                                    <div className={`status-dot status-${report.status}`}></div>
                                    <div className="title-wrapper">
                                        <span className="title-text">{report.title}</span>
                                        <div className="location-wrapper">
                                            <span className="location-general">{report.areaName}</span>
                                            <span className="location-specific">{report.locationName}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`report-category-badge ${report.isClassifying ? 'analyzing' : ''} severity-${report.severity || 'medium'}`}>
                                    {report.isClassifying && <Cpu size={10} className="spin" style={{ marginRight: '4px' }} />}
                                    {report.category || 'General'}
                                </div>
                            </div>
                            <p className="report-desc">{report.description}</p>
                            <div className="report-actions-footer">
                                {!report.isSolved && (
                                    <>
                                        <button className="action-btn edit" disabled={report.isClassifying} onClick={e => { e.stopPropagation(); onEdit(report); }}>
                                            <Edit3 size={14} /><span>Edit</span>
                                        </button>
                                        <button className="action-btn solve" disabled={report.isClassifying} onClick={e => { e.stopPropagation(); onSolve(report.id); }}>
                                            <CheckCircle size={14} /><span>Mark Solved</span>
                                        </button>
                                    </>
                                )}
                                <button className="action-btn delete" disabled={report.isClassifying} onClick={e => { e.stopPropagation(); onDelete(report.id); }}>
                                    <Trash2 size={14} /><span>Remove</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Dashboard view: merged incidents + community notices */}
                {!isHistoryView && filteredItems.map((item, index) => {
                    const isIncident = item._itemType === 'incident';
                    const isClassicReport = !!item.title; // classic map report from reportList
                    const isCommunityIncident = !isClassicReport && isIncident; // community post promoted to incident
                    const sevColors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.medium;

                    // Classic map report card
                    if (isClassicReport) {
                        return (
                            <div
                                key={`rpt-${item.id}`}
                                className={`report-card fade-in ${item.isFake ? 'is-fake' : ''} ${item.isClassifying ? 'is-validating' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => !item.isClassifying && onReportClick(item)}
                            >
                                {item.image && <img src={item.image} alt={item.title} className="report-img" />}
                                <div className="report-info">
                                    <div className="report-title-row">
                                        <div className="report-title">
                                            <div className={`status-dot status-${item.status}`}></div>
                                            <div className="title-wrapper">
                                                <span className="title-text">{item.title}</span>
                                                <div className="location-wrapper">
                                                    <span className="location-general">{item.areaName}</span>
                                                    <span className="location-specific">{item.locationName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`report-category-badge ${item.isClassifying ? 'analyzing' : ''} severity-${item.severity || 'medium'}`}>
                                            {item.isClassifying && <Cpu size={10} style={{ marginRight: 4 }} />}
                                            {item.category || 'General'}
                                        </div>
                                    </div>
                                    <p className="report-desc">{item.description}</p>
                                </div>
                            </div>
                        );
                    }

                    // Community incident — IDENTICAL rendering to classic map report card
                    if (isCommunityIncident) {
                        const locLabel = item.location
                            ? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`
                            : 'Location pinned';
                        return (
                            <div
                                key={`comm-inc-${item.id}`}
                                className={`report-card fade-in severity-${item.severity || 'high'}`}
                                style={{ animationDelay: `${index * 0.05}s`, cursor: item.location ? 'pointer' : 'default' }}
                                onClick={() => item.location && onReportClick && onReportClick({ ...item, title: item.content?.slice(0, 60) })}
                            >
                                {item.image && <img src={item.image} alt="Evidence" className="report-img" />}
                                <div className="report-info">
                                    <div className="report-title-row">
                                        <div className="report-title">
                                            <div className="status-dot status-red"></div>
                                            <div className="title-wrapper">
                                                <span className="title-text">
                                                    {item.content?.slice(0, 60)}{item.content?.length > 60 ? '…' : ''}
                                                </span>
                                                <div className="location-wrapper">
                                                    <span className="location-general">{item.author}</span>
                                                    {item.location && (
                                                        <span className="location-specific"><MapPin size={9} style={{ display: 'inline', marginRight: 2 }} />{locLabel}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`report-category-badge severity-${item.severity || 'high'}`}>
                                            {item.category || 'Incident'}
                                        </div>
                                    </div>
                                    <p className="report-desc">{item.content}</p>
                                </div>
                            </div>
                        );
                    }

                    // Community safety notice card
                    return (
                        <div
                            key={`comm-${item.id}`}
                            className="report-card community-report-card fade-in community-notice"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Community source badge */}
                            <div className="comm-report-source" style={{ color: item.communityColor }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.communityColor, flexShrink: 0 }} />
                                {item.communityName}
                            </div>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="report-desc" style={{ marginBottom: 8 }}>{item.content}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ background: sevColors.bg, color: sevColors.text, border: `1px solid ${sevColors.border}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>
                                            <Flame size={9} /> {item.severity}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Clock size={10} /> {timeAgo(item.timestamp)}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Users size={10} /> {item.author}
                                        </span>
                                    </div>
                                </div>
                                {item.image && (
                                    <img src={item.image} alt="Evidence" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {!isHistoryView && filteredItems.length === 0 && (
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                        <AlertTriangle size={36} style={{ opacity: 0.12, marginBottom: 14 }} />
                        <p style={{ fontSize: 14 }}>No {activeFilter === 'incidents' ? 'incidents' : activeFilter === 'notices' ? 'safety notices' : 'reports'} in the last 3 days.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
