import React, { useState, useMemo, useEffect } from 'react';
import { Cpu, CheckCircle, Trash2, Edit3, AlertTriangle, MapPin, Clock, Zap, Globe } from 'lucide-react';
import { deleteReport } from '../firebase/services';

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

function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    user,
    userLocation
}) {
    const [sortMode, setSortMode] = useState('time');

    const [, setTimeTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTimeTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, []);

    // Shared timestamp extractor for both report types (fallback to r.id which is Date.now() for map reports)
    const getTime = r => r.timestamp || (r.createdAt ? new Date(r.createdAt).getTime() : r.id);

    const mergedItems = useMemo(() => {
        const allItems = reportList
            .map(r => ({ ...r, _itemType: 'incident', _source: 'map' }));

        if (sortMode === 'closest') {
            allItems.sort((a, b) => {
                const distA = a.location ? getDistance(userLocation?.lat, userLocation?.lng, a.location.lat, a.location.lng) : Infinity;
                const distB = b.location ? getDistance(userLocation?.lat, userLocation?.lng, b.location.lat, b.location.lng) : Infinity;
                if (distA === Infinity && distB === Infinity) return getTime(b) - getTime(a);
                return distA - distB;
            });
        } else {
            allItems.sort((a, b) => getTime(b) - getTime(a));
        }

        // Deduplicate incidents that were shared to multiple communities / public map
        const seenMapIncidents = new Map();
        const finalItems = [];

        for (const item of allItems) {
            if (item._itemType === 'incident') {
                const trackId = item.linkedReportId || item.id;
                if (!seenMapIncidents.has(trackId)) {
                    if (item.communityName) {
                        item.matchedCommunityTags = [{ name: item.communityName, color: item.communityColor }];
                    } else {
                        item.matchedCommunityTags = [];
                    }
                    seenMapIncidents.set(trackId, item);
                    finalItems.push(item);
                } else {
                    if (item.communityName) {
                        const original = seenMapIncidents.get(trackId);
                        if (!original.matchedCommunityTags) {
                            original.matchedCommunityTags = [];
                        }
                        if (!original.matchedCommunityTags.find(t => t.name === item.communityName)) {
                            original.matchedCommunityTags.push({ name: item.communityName, color: item.communityColor });
                        }
                    }
                }
            } else {
                finalItems.push(item);
            }
        }
        return finalItems;
    }, [reportList, communityPosts, sortMode, userLocation]);

    const availableCommunities = useMemo(() => {
        const comms = new Map();
        for (const item of mergedItems) {
            if (item.communityName) {
                comms.set(item.communityName, { name: item.communityName, color: item.communityColor });
            }
            if (item.matchedCommunityTags) {
                for (const tag of item.matchedCommunityTags) {
                    comms.set(tag.name, { name: tag.name, color: tag.color });
                }
            }
        }
        return Array.from(comms.values());
    }, [mergedItems]);

    const filteredItems = mergedItems;



    return (
        <section className="reports-panel">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{isHistoryView ? 'My Report History' : 'Recent Reports'}</h2>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4, gap: 4 }}>
                    <button
                        onClick={() => setSortMode('time')}
                        style={{ padding: '6px 12px', background: sortMode === 'time' ? 'rgba(255,255,255,0.1)' : 'transparent', color: sortMode === 'time' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}
                    >Time</button>
                    <button
                        onClick={() => setSortMode('closest')}
                        style={{ padding: '6px 12px', background: sortMode === 'closest' ? 'rgba(255,255,255,0.1)' : 'transparent', color: sortMode === 'closest' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}
                    >Closest</button>
                </div>
            </div>

            <div className="reports-list">
                {/* History view: classic report cards */}
                {isHistoryView && [...reportList].sort((a, b) => {
                    if (sortMode === 'closest') {
                        const distA = a.location ? getDistance(userLocation?.lat, userLocation?.lng, a.location.lat, a.location.lng) : Infinity;
                        const distB = b.location ? getDistance(userLocation?.lat, userLocation?.lng, b.location.lat, b.location.lng) : Infinity;
                        if (distA === Infinity && distB === Infinity) return getTime(b) - getTime(a);
                        return distA - distB;
                    }
                    return getTime(b) - getTime(a);
                }).map((report, index) => {
                    const item = report;
                    const title = item.title || 'Notice';
                    const description = item.description;
                    const category = item.category || 'Incident';
                    const severity = item.severity || 'medium';
                    const statusClass = item.isSolved
                        ? `status-${item.status}`  // blue for solved
                        : severity === 'low'
                            ? 'status-green'         // green dot for low severity
                            : `status-${item.status}`;
                    const generalLoc = item.areaName;
                    const specificLoc = item.locationName;

                    return (
                        <div
                            key={`hist-${item.id}`}
                            className={`report-card fade-in ${item.isFake ? 'is-fake' : ''} ${item.isClassifying ? 'is-validating' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                            onClick={() => !item.isClassifying && onReportClick(item)}
                        >
                            {/* Community Tag (if any) */}
                            {item.communityName && (
                                <div className="comm-report-source" style={{ color: item.communityColor, padding: '12px 14px 4px 14px', borderBottom: 'none', background: 'transparent' }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.communityColor, flexShrink: 0 }} />
                                    {item.communityName}
                                </div>
                            )}

                            {/* Info Top: Title row */}
                            <div className="report-info" style={{ paddingBottom: item.image ? 12 : undefined }}>
                                <div className="report-title-row">
                                    <div className="report-title">
                                        <div className={`status-dot ${statusClass}`}></div>
                                        <div className="title-wrapper">
                                            <span className="title-text">{title}</span>
                                            <div className="location-wrapper">
                                                <span className="location-general">{generalLoc}</span>
                                                {specificLoc && <span className="location-specific">{specificLoc}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`report-category-badge ${item.isClassifying ? 'analyzing' : ''} severity-${severity}`}>
                                        {item.isClassifying && <Cpu size={10} className="spin" style={{ marginRight: '4px' }} />}
                                        {category}
                                    </div>
                                </div>
                            </div>

                            {/* Image */}
                            {item.image && <img src={item.image} alt={title} className="report-img" style={{ borderRadius: 0 }} />}

                            {/* Info Bottom: Description & Actions */}
                            <div className="report-info" style={{ paddingTop: item.image ? 12 : (item.communityName ? 0 : 4) }}>
                                {description && <p className="report-desc">{description}</p>}

                                {/* Timestamp */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)', opacity: 0.8 }}>
                                    <Clock size={11} />
                                    <span>{timeAgo(getTime(item)) || 'Unknown time'}</span>
                                    {item.isSolved && <span style={{ marginLeft: 8, color: '#38BDF8', fontWeight: 600 }}>✓ Solved</span>}
                                </div>

                                <div className="report-actions-footer">
                                    {!item.isSolved && (
                                        <>
                                            <button className="action-btn edit" disabled={item.isClassifying} onClick={e => { e.stopPropagation(); onEdit(item); }}>
                                                <Edit3 size={14} /><span>Edit</span>
                                            </button>
                                            <button className="action-btn solve" disabled={item.isClassifying} onClick={e => { e.stopPropagation(); onSolve(item.id); }}>
                                                <CheckCircle size={14} /><span>Mark Solved</span>
                                            </button>
                                        </>
                                    )}
                                    <button className="action-btn delete" disabled={item.isClassifying} onClick={e => { e.stopPropagation(); onDelete(item.id); }}>
                                        <Trash2 size={14} /><span>Remove</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Dashboard view: Unified report format */}
                {!isHistoryView && filteredItems.map((item, index) => {
                    const isIncident = item._itemType === 'incident';
                    const isClassicReport = !!item.title && !item.communityId; // classic map report

                    // Parse title & description differently to avoid duplicates
                    let title = 'Notice';
                    let description = '';

                    if (isClassicReport) {
                        title = item.title;
                        description = item.description;
                    } else if (item.title && item.description) {
                        // Support for well-formed community posts
                        title = item.title;
                        description = item.description;
                    } else if (item.content) {
                        // Fallback parsing for legacy community posts
                        if (item.content.includes(' — ')) {
                            const parts = item.content.split(' — ');
                            title = parts[0];
                            description = parts.slice(1).join(' — ');
                        } else {
                            // Don't repeat identical short text; default title to "Notice" if content doesn't naturally split
                            title = item.content.length > 50 ? item.content.slice(0, 47) + '...' : 'Notice';
                            description = item.content;
                        }
                    }

                    const category = item.category || (isIncident ? 'Incident' : 'Notice');
                    const severity = item.severity || 'medium';
                    const statusClass = isClassicReport
                        ? (item.isSolved
                            ? `status-${item.status}`   // blue for solved
                            : severity === 'low'
                                ? 'status-green'          // green dot for low severity
                                : `status-${item.status}`)
                        : (isIncident ? 'status-red' : 'status-orange');

                    const generalLoc = isClassicReport ? item.areaName : item.author;
                    let specificLoc = isClassicReport ? item.locationName : '';
                    if (!isClassicReport && item.location) {
                        specificLoc = `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`;
                    }

                    return (
                        <div
                            key={`${item._itemType}-${item.id}`}
                            className={`report-card fade-in ${item.isFake ? 'is-fake' : ''} ${item.isClassifying ? 'is-validating' : ''}`}
                            style={{ animationDelay: `${index * 0.05}s`, cursor: item.location || isClassicReport ? 'pointer' : 'default' }}
                            onClick={() => {
                                if (item.isClassifying) return;
                                if (isClassicReport) onReportClick(item);
                                else if (item.location && onReportClick) onReportClick({ ...item, title });
                            }}
                        >
                            {/* Community Tags */}
                            {item.matchedCommunityTags && item.matchedCommunityTags.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 14px 4px 14px' }}>
                                    {item.matchedCommunityTags.map(tag => (
                                        <div key={tag.name} className="comm-report-source" style={{ color: tag.color, padding: 0, borderBottom: 'none', background: 'transparent' }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                                            {tag.name}
                                        </div>
                                    ))}
                                </div>
                            ) : item.communityName && (
                                <div className="comm-report-source" style={{ color: item.communityColor, padding: '12px 14px 4px 14px', borderBottom: 'none', background: 'transparent' }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.communityColor, flexShrink: 0 }} />
                                    {item.communityName}
                                </div>
                            )}

                            {/* Info Top: Title row */}
                            <div className="report-info" style={{ paddingBottom: item.image ? 12 : undefined }}>
                                <div className="report-title-row">
                                    <div className="report-title">
                                        <div className={`status-dot ${statusClass}`}></div>
                                        <div className="title-wrapper">
                                            <span className="title-text">{title}</span>
                                            <div className="location-wrapper">
                                                <span className="location-general">{generalLoc}</span>
                                                {specificLoc && (
                                                    <span className="location-specific">
                                                        {!isClassicReport && <MapPin size={9} style={{ display: 'inline', marginRight: 2 }} />}
                                                        {specificLoc}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`report-category-badge ${item.isClassifying ? 'analyzing' : ''} severity-${severity}`}>
                                        {item.isClassifying && <Cpu size={10} style={{ marginRight: 4 }} />}
                                        {category}
                                    </div>
                                </div>
                            </div>

                            {/* Image */}
                            {item.image && <img src={item.image} alt={title} className="report-img" style={{ borderRadius: 0 }} />}

                            {/* Info Bottom: Description */}
                            <div className="report-info" style={{ paddingTop: item.image ? 12 : (item.communityName ? 0 : 4) }}>
                                {description && <p className="report-desc">{description}</p>}

                                {/* Time & metadata — shown for all item types */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} /> {timeAgo(getTime(item)) || 'Unknown time'}
                                    </span>
                                    {item.isSolved && (
                                        <span style={{ color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                            ✓ Solved
                                        </span>
                                    )}
                                    {!isClassicReport && !item.location && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Globe size={11} /> General Notice
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!isHistoryView && filteredItems.length === 0 && (
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                        <AlertTriangle size={36} style={{ opacity: 0.12, marginBottom: 14 }} />
                        <p style={{ fontSize: 14 }}>No reports yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
