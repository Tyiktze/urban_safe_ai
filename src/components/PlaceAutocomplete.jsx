import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin } from 'lucide-react';

/**
 * PlaceAutocomplete
 * Uses the classic google.maps.places.Autocomplete API attached to a real <input>.
 * Supports:
 *  - Typing and selecting from the dropdown (standard autocomplete)
 *  - Pressing Enter without selecting → geocodes whatever text is in the box
 *  - Paste + Enter also works
 */
export default function PlaceAutocomplete({ onPlaceSelect, darkMode = true }) {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const onPlaceSelectRef = useRef(onPlaceSelect);
    const [isFocused, setIsFocused] = useState(false);

    // Keep callback ref current
    useEffect(() => {
        onPlaceSelectRef.current = onPlaceSelect;
    }, [onPlaceSelect]);

    useEffect(() => {
        if (!inputRef.current) return;

        // Retry until Google Maps Places API is ready
        let attempts = 0;
        const tryInit = () => {
            attempts++;
            if (
                window.google &&
                window.google.maps &&
                window.google.maps.places &&
                window.google.maps.places.Autocomplete
            ) {
                initAutocomplete();
            } else if (attempts < 30) {
                setTimeout(tryInit, 300);
            }
        };
        tryInit();

        function initAutocomplete() {
            if (autocompleteRef.current) return; // already initialized

            const ac = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ['formatted_address', 'geometry', 'name'],
            });
            autocompleteRef.current = ac;

            // User picks an item from the dropdown
            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                const address = place.formatted_address || place.name || inputRef.current.value;
                if (address && onPlaceSelectRef.current) {
                    onPlaceSelectRef.current(address);
                }
            });
        }

        return () => {
            // Cleanup google listener if needed
            if (autocompleteRef.current && window.google) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Prevent the default form submit that could close any parent forms
            e.preventDefault();
            const value = inputRef.current?.value?.trim();
            if (value && onPlaceSelectRef.current) {
                // Give the Autocomplete dropdown a moment to resolve,
                // then fall back to geocoding the raw text if no place was chosen
                setTimeout(() => {
                    const place = autocompleteRef.current?.getPlace?.();
                    if (!place || !place.geometry) {
                        // No dropdown selection — geocode whatever the user typed
                        onPlaceSelectRef.current(value);
                    }
                }, 50);
            }
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <Search
                size={16}
                style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: isFocused ? 'var(--accent-orange)' : 'var(--text-secondary)',
                    pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s'
                }}
            />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search address or location..."
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%',
                    height: 44,
                    background: isFocused
                        ? (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                        : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                    border: `1px solid ${isFocused ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                    borderRadius: 12,
                    paddingLeft: 40,
                    paddingRight: 16,
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                }}
            />
        </div>
    );
}
