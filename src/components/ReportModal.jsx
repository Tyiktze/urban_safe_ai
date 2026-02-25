import { MapPin, Cpu, Upload, Plus, Edit3, Globe, Users, CheckCircle } from 'lucide-react';

export default function ReportModal({
    isOpen,
    onClose,
    selectedLocation,
    formData,
    setFormData,
    imagePreview,
    setImagePreview,
    handleImageChange,
    handleSubmit,
    categories,
    selectedAddress,
    isEditing = false,
    cooldownRemaining = 0,
    editCooldownRemaining = 0,
    joinedCommunities = [],
}) {
    if (!isOpen) return null;

    const isCooldownActive = isEditing ? editCooldownRemaining > 0 : cooldownRemaining > 0;
    const currentCooldown = isEditing ? editCooldownRemaining : cooldownRemaining;

    const toggleCommunity = (id) => {
        const current = formData.audienceIds || [];
        const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
        setFormData({ ...formData, audienceIds: next });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{isEditing ? 'Edit Report' : 'Report Incident'}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Location: {selectedAddress || (selectedLocation?.lat ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : "N/A")}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            Incident Title / Type
                            <span className="ai-detect-badge">
                                <Cpu size={10} /> AI Auto-Classifier
                            </span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Huge pothole, Broken street light..."
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value.slice(0, 25) })}
                            maxLength={25}
                            required
                        />
                        <div className="char-counter">
                            {formData.category?.length || 0}/25
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                            rows="3"
                            placeholder="Tell us what you see..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 300) })}
                            maxLength={300}
                        ></textarea>
                        <div className="char-counter">
                            {formData.description?.length || 0}/300
                        </div>
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
                                    <span>Upload Image(s) (Optional)</span>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImagePreview(null);
                                    setFormData({ ...formData, image: null });
                                }}
                            >
                                Change Image
                            </button>
                        )}
                    </div>

                    {/* ── Share To ─────────────────────────────────────── */}
                    <div className="form-group">
                        <label style={{ marginBottom: 8, display: 'block' }}>Share To</label>

                        {/* Public toggle */}
                        <div
                            className={`audience-opt${formData.isPublic !== false ? ' active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer', border: '1px solid', borderColor: formData.isPublic !== false ? 'var(--accent-orange)' : 'var(--glass-border)', background: formData.isPublic !== false ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)', transition: 'all 0.2s' }}
                            onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                        >
                            <Globe size={14} style={{ color: formData.isPublic !== false ? 'var(--accent-orange)' : 'var(--text-secondary)', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: formData.isPublic !== false ? 'var(--accent-orange)' : 'var(--text-primary)' }}>Public Map</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Visible to all UrbanSafe users on the map</div>
                            </div>
                            {formData.isPublic !== false && <CheckCircle size={14} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />}
                        </div>

                        {/* Community chips */}
                        {joinedCommunities.length > 0 && (
                            <>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Users size={11} /> Also share to communities (optional)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {joinedCommunities.map(c => {
                                        const active = (formData.audienceIds || []).includes(c.id);
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => toggleCommunity(c.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                    border: `1px solid ${active ? c.color : 'var(--glass-border)'}`,
                                                    background: active ? c.color + '22' : 'rgba(255,255,255,0.03)',
                                                    color: active ? c.color : 'var(--text-secondary)',
                                                    transition: 'all 0.18s',
                                                }}
                                            >
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                                                {c.name}
                                                {active && <CheckCircle size={11} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ flex: 1 }}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="create-btn"
                                style={{ flex: 1, opacity: isCooldownActive ? 0.6 : 1, cursor: isCooldownActive ? 'not-allowed' : 'pointer' }}
                                disabled={isCooldownActive}
                            >
                                {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
                                <span>
                                    {isEditing
                                        ? isCooldownActive ? `Wait ${currentCooldown}s` : 'Update Report'
                                        : isCooldownActive
                                            ? `Wait ${currentCooldown}s`
                                            : 'Submit Report'}
                                </span>
                            </button>
                        </div>
                        {isCooldownActive && (
                            <p style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center', margin: 0 }}>
                                Rate limit active. Please wait {isEditing ? '15s' : '30s'} between {isEditing ? 'edits' : 'reports'}.
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
