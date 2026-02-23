import { MoreVertical, Cpu, CheckCircle, Trash2, Edit3 } from 'lucide-react';

export default function ReportsPanel({ reportList, onReportClick, onDelete, onSolve, onEdit, isHistoryView }) {
    return (
        <section className="reports-panel">
            <div className="panel-header">
                <h2>{isHistoryView ? 'My Report History' : 'Recent Reports'}</h2>
            </div>

            <div className="reports-list">
                {reportList.map((report, index) => (
                    <div
                        key={report.id}
                        className={`report-card fade-in ${report.isFake ? 'is-fake' : ''} ${report.isClassifying ? 'is-validating' : ''}`}
                        style={{
                            animationDelay: `${index * 0.1}s`
                        }}
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

                            {isHistoryView && (
                                <div className="report-actions-footer">
                                    {!report.isSolved && (
                                        <>
                                            <button
                                                className="action-btn edit"
                                                disabled={report.isClassifying}
                                                onClick={(e) => { e.stopPropagation(); onEdit(report); }}
                                            >
                                                <Edit3 size={14} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                className="action-btn solve"
                                                disabled={report.isClassifying}
                                                onClick={(e) => { e.stopPropagation(); onSolve(report.id); }}
                                            >
                                                <CheckCircle size={14} />
                                                <span>Mark Solved</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="action-btn delete"
                                        disabled={report.isClassifying}
                                        onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
                                    >
                                        <Trash2 size={14} />
                                        <span>Remove</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
