import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    GeoPoint
} from "firebase/firestore";
import { db } from "./config";

// --- Users, Notifications, Settings ---

/**
 * Creates or updates a user profile.
 */
export const setUserProfile = async (userId, userData) => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
        ...userData,
        updated_at: serverTimestamp(),
        created_at: userData.created_at || serverTimestamp()
    }, { merge: true });
};

/**
 * Adds a notification for a specific user.
 */
export const addNotification = async (userId, notificationData) => {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
        user_id: userId,
        message: notificationData.message,
        type: notificationData.type || "info",
        is_read: false,
        created_at: serverTimestamp()
    });
};

/**
 * Sets user settings.
 */
export const setUserSettings = async (userId, settingsData) => {
    const settingsRef = doc(db, "settings", userId);
    await setDoc(settingsRef, {
        user_id: userId,
        dark_mode: settingsData.dark_mode ?? false,
        map_style: settingsData.map_style || "default",
        notif_toggle: settingsData.notif_toggle ?? true
    }, { merge: true });
};

// --- Reports and Comments ---

/**
 * Creates a new safety report.
 */
export const createReport = async (reportData) => {
    const reportsRef = collection(db, "reports");
    // Assuming reportData.location is { lat, lng }
    const location = new GeoPoint(reportData.location.lat, reportData.location.lng);

    const docRef = await addDoc(reportsRef, {
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        location: location,
        status: reportData.status || "pending",
        timestamp: serverTimestamp(),
        user_id: reportData.user_id,
        // image field left optional per user request
        image: reportData.image || null
    });
    return docRef.id;
};

/**
 * Adds a comment to a report.
 */
export const addComment = async (reportId, userId, text) => {
    const commentsRef = collection(db, "comments");
    await addDoc(commentsRef, {
        report_id: reportId,
        user_id: userId,
        text: text,
        timestamp: serverTimestamp()
    });
};

/**
 * Fetches all reports.
 */
export const getReports = async () => {
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
