import { MapPin, Cpu, Upload, Plus, Edit3 } from 'lucide-react';

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
    editCooldownRemaining = 0
}) {
    if (!isOpen) return null;

    const isCooldownActive = isEditing ? editCooldownRemaining > 0 : cooldownRemaining > 0;
    const currentCooldown = isEditing ? editCooldownRemaining : cooldownRemaining;

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
                    {/* ... form content ... */}
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
                        <label>Description</label>
                        <textarea
                            rows="3"
                            placeholder="Tell us what you see..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 300) })}
                            maxLength={300}
                            required
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
