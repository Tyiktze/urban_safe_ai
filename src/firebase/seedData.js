import { setUserProfile, setUserSettings, addNotification, createReport, addComment } from "./services";

/**
 * Seed initial data to Firestore based on the user's requested structure.
 */
export const seedInitialData = async () => {
    try {
        const demoUserId = "user_demo_123";

        // 1. Create User Profile
        await setUserProfile(demoUserId, {
            username: "city_guardian",
            email: "guardian@example.com",
            role: "admin",
            password_hash: "hashed_password_demo", // In real app, handling hashing elsewhere
            reputation_score: 100
        });
        console.log("User profile seeded.");

        // 2. Set User Settings
        await setUserSettings(demoUserId, {
            dark_mode: true,
            map_style: "satellite",
            notif_toggle: true
        });
        console.log("User settings seeded.");

        // 3. Add a Notification
        await addNotification(demoUserId, {
            message: "Welcome to Urban Safe AI!",
            type: "welcome"
        });
        console.log("Notification seeded.");

        // 4. Create a Report
        const reportId = await createReport({
            title: "Pothole on Main St",
            description: "Large pothole spotted near the intersection.",
            category: "Infrastructure",
            location: { lat: 3.1390, lng: 101.6869 }, // Example: Kuala Lumpur coordinates
            status: "resolved",
            user_id: demoUserId
        });
        console.log("Report seeded with ID:", reportId);

        // 5. Add a Comment
        await addComment(reportId, demoUserId, "Work in progress by the city council.");
        console.log("Comment seeded.");

        return { success: true, message: "Initial data seeded successfully." };
    } catch (error) {
        console.error("Error seeding data:", error);
        return { success: false, error: error.message };
    }
};
