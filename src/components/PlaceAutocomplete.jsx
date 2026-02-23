import React, { useEffect, useRef } from 'react';

export default function PlaceAutocomplete({ onPlaceSelect, darkMode = true }) {
    const containerRef = useRef(null);
    const autocompleteRef = useRef(null);
    const onPlaceSelectRef = useRef(onPlaceSelect);

    // Update the ref whenever the prop changes
    useEffect(() => {
        onPlaceSelectRef.current = onPlaceSelect;
    }, [onPlaceSelect]);

    // Handle theme changes
    useEffect(() => {
        if (autocompleteRef.current) {
            // Some modern Google components support a theme attribute
            // We also update the class on the container for CSS overrides
            if (darkMode) {
                autocompleteRef.current.setAttribute('theme', 'dark');
            } else {
                autocompleteRef.current.setAttribute('theme', 'light');
            }
        }
    }, [darkMode]);

    useEffect(() => {
        // Wait for google maps to be available
        if (!containerRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
            return;
        }

        // Only initialize once
        if (autocompleteRef.current) return;

        // Clear container (especially helpful for React 18/19 double-invoking useEffect)
        containerRef.current.innerHTML = '';

        try {
            // Use the new PlaceAutocompleteElement
            const autocomplete = new google.maps.places.PlaceAutocompleteElement();
            autocomplete.style.width = '100%';
            autocomplete.requestedFields = ['location', 'viewport'];

            // Set initial theme
            if (darkMode) {
                autocomplete.setAttribute('theme', 'dark');
            } else {
                autocomplete.setAttribute('theme', 'light');
            }

            autocompleteRef.current = autocomplete;
            containerRef.current.appendChild(autocomplete);
            // ... existing code ...

            const listener = (event) => {
                console.log("PlaceAutocomplete selection event triggered:", event.type);

                // USER REQUEST: Just use the string value for smart geocoding
                const address = autocomplete.value;

                console.log("Passing address for geocoding:", address);

                if (address && onPlaceSelectRef.current) {
                    onPlaceSelectRef.current(address);
                }
            };

            // Register selection events
            autocomplete.addEventListener('gmp-placeselect', listener);
            autocomplete.addEventListener('gmp-select', listener);
            autocomplete.addEventListener('change', listener);

        } catch (error) {
            console.error("Error initializing PlaceAutocompleteElement:", error);
        }

        return () => {
            // Cleanup logic if needed
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`custom-autocomplete-container ${darkMode ? 'dark' : 'light'}`}
        />
    );
}
