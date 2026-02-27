import React, { useState, useMemo, useEffect } from 'react';
import { Cpu, CheckCircle, Trash2, Edit3, AlertTriangle, MapPin, Clock, Zap } from 'lucide-react';
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



export default function ReportsPanel({
    reportList = [],
    communityPosts = [],
    onReportClick,
    onDelete,
    onSolve,
    onEdit,
    isHistoryView,
    onViewOnMap,
    user
}) {
    const [, setTimeTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTimeTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, []);


    // Shared timestamp extractor for both report types (fallback to r.id which is Date.now() for map reports)
    const getTime = r => r.timestamp || (r.createdAt ? new Date(r.createdAt).getTime() : r.id);

    const mergedItems = useMemo(() => {
        const allItems = reportList
            .map(r => ({ ...r, _itemType: 'incident', _source: 'map' }))
            .sort((a, b) => getTime(b) - getTime(a));

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
    }, [reportList, communityPosts]);

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
            <div className="panel-header">
                <h2>{isHistoryView ? 'My Report History' : 'Recent Reports'}</h2>
            </div>


            <div className="reports-list">
                {/* History view: classic report cards — sorted newest first */}
                {isHistoryView && [...reportList].sort((a, b) => getTime(b) - getTime(a)).map((report, index) => {
                    const item = report;
                    const title = item.title || 'Notice';
                    const description = item.description;
                    const category = item.category || 'Incident';
                    const severity = item.severity || 'medium';
                    const statusClass = `status-${item.status}`;
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
                    const statusClass = isClassicReport ? `status-${item.status}` : (isIncident ? 'status-red' : 'status-orange');

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

                                {/* Extra metadata for community posts */}
                                {!isClassicReport && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={11} /> {timeAgo(item.timestamp)}
                                        </span>
                                        {!item.location && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Globe size={11} /> General Notice
                                            </span>
                                        )}
                                    </div>
                                )}
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
