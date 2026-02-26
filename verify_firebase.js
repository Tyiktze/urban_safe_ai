import { seedInitialData } from './src/firebase/seedData';

// This is a temporary script to verify the Firebase connection.
// It will be executed via node (using a bundler or manual setup if needed).
// For simplicity, I will try to run this via a small vite-node like approach or just verify via code review
// since I don't have a direct backend runner for Firestore in this environment without a dev server.

console.log("Starting Firebase Verification...");

seedInitialData().then(result => {
    if (result.success) {
        console.log("SUCCESS:", result.message);
    } else {
        console.log("FAILURE:", result.error);
    }
}).catch(err => {
    console.error("CRITICAL ERROR:", err);
});
