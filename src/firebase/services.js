import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    GeoPoint
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { db, auth } from "./config";

export { db, auth };

export const getUserSettings = async (userId) => {
    const settingsRef = doc(db, "settings", userId);
    const snap = await getDoc(settingsRef);
    return snap.exists() ? snap.data() : null;
};

export const getUserJoinedCommunities = async (userId) => {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data().joined_communities || []) : [];
};

export const syncUserJoinedCommunities = async (userId, joinedIds) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        joined_communities: joinedIds,
        updated_at: serverTimestamp()
    });
};


// --- Authentication Services ---

export const signUpUser = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signInUser = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
};

export const signOutUser = async () => {
    await signOut(auth);
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};


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

/**
 * Deletes a report from Firestore.
 */
export const deleteReport = async (reportId) => {
    const reportRef = doc(db, "reports", reportId);
    await deleteDoc(reportRef);
};

// ─────────────────────────────────────────────────────
// Community services
// ─────────────────────────────────────────────────────

/**
 * Creates a new community in Firestore.
 */
export const createCommunity = async (communityData) => {
    const commRef = collection(db, "communities");
    const docRef = await addDoc(commRef, {
        name: communityData.name,
        description: communityData.description || "",
        isPrivate: communityData.isPrivate ?? false,
        memberCount: 1,
        color: communityData.color,
        tag: communityData.tag,
        ownerId: communityData.ownerId || "anonymous",
        location: communityData.location
            ? new GeoPoint(communityData.location.lat, communityData.location.lng)
            : null,
        created_at: serverTimestamp(),
    });
    return docRef.id;
};

/**
 * Fetches all communities from Firestore.
 */
export const getCommunities = async () => {
    const commRef = collection(db, "communities");
    const q = query(commRef, orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        // Convert GeoPoint back to { lat, lng }
        const loc = data.location
            ? { lat: data.location.latitude, lng: data.location.longitude }
            : null;
        return { id: d.id, ...data, location: loc };
    });
};

/**
 * Updates a community's member count (join/leave).
 */
export const updateCommunityMemberCount = async (communityId, delta) => {
    const commRef = doc(db, "communities", communityId);
    const snap = await getDoc(commRef);
    if (!snap.exists()) return;
    const current = snap.data().memberCount || 0;
    await updateDoc(commRef, { memberCount: Math.max(0, current + delta) });
};

// ─────────────────────────────────────────────────────
// Community Post services
// ─────────────────────────────────────────────────────

/**
 * Creates a new post in a community.
 */
export const createCommunityPost = async (postData) => {
    const postsRef = collection(db, "community_posts");
    const docRef = await addDoc(postsRef, {
        type: postData.type || "post",           // 'post' | 'incident'
        author: postData.author || "Anonymous",
        avatar: postData.avatar || "An",
        content: postData.content,
        communityId: postData.communityId,
        communityName: postData.communityName || "",
        communityColor: postData.communityColor || "#ff6b35",
        category: postData.category || "community",
        severity: postData.severity || "low",
        image: postData.image || null,
        likes: 0,
        comments: 0,
        location: postData.location
            ? new GeoPoint(postData.location.lat, postData.location.lng)
            : null,
        timestamp: serverTimestamp(),
    });
    return docRef.id;
};

/**
 * Fetches all posts for a given community.
 */
export const getCommunityPosts = async (communityId) => {
    const postsRef = collection(db, "community_posts");
    const q = query(
        postsRef,
        where("communityId", "==", communityId),
        orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        const loc = data.location
            ? { lat: data.location.latitude, lng: data.location.longitude }
            : null;
        return {
            id: d.id,
            ...data,
            location: loc,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
        };
    });
};

/**
 * Fetches posts for multiple joined communities (last 3 days).
 */
export const getPostsForCommunities = async (communityIds) => {
    if (!communityIds || communityIds.length === 0) return [];
    const postsRef = collection(db, "community_posts");
    // Firestore 'in' queries support max 10 items at once
    const chunks = [];
    for (let i = 0; i < communityIds.length; i += 10) {
        chunks.push(communityIds.slice(i, i + 10));
    }
    const results = [];
    for (const chunk of chunks) {
        const q = query(postsRef, where("communityId", "in", chunk), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            const data = d.data();
            const loc = data.location
                ? { lat: data.location.latitude, lng: data.location.longitude }
                : null;
            results.push({
                id: d.id,
                ...data,
                location: loc,
                timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
            });
        });
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Deletes a community post.
 */
export const deleteCommunityPost = async (postId) => {
    const postRef = doc(db, "community_posts", postId);
    await deleteDoc(postRef);
};

// ─────────────────────────────────────────────────────
// Interaction and Notification services
// ─────────────────────────────────────────────────────

/**
 * Fetches notifications for a specific user.
 */
export const getNotifications = async (userId) => {
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("user_id", "==", userId), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().created_at?.toMillis ? d.data().created_at.toMillis() : Date.now() }));
};

/**
 * Marks a notification as read.
 */
export const markNotificationRead = async (notifId) => {
    const notifRef = doc(db, "notifications", notifId);
    await updateDoc(notifRef, { is_read: true });
};

/**
 * Deletes a notification.
 */
export const deleteNotification = async (notifId) => {
    const notifRef = doc(db, "notifications", notifId);
    await deleteDoc(notifRef);
};

/**
 * Likes or unlikes a community post.
 */
export const toggleLikePost = async (postId, userId, isLiked) => {
    const postRef = doc(db, "community_posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const currentLikes = postSnap.data().likes || 0;
    await updateDoc(postRef, {
        likes: Math.max(0, currentLikes + (isLiked ? 1 : -1))
    });
};

/**
 * Dislikes or undislikes a community post.
 */
export const toggleDislikePost = async (postId, userId, isDisliked) => {
    const postRef = doc(db, "community_posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const currentDislikes = postSnap.data().dislikes || 0;
    await updateDoc(postRef, {
        dislikes: Math.max(0, currentDislikes + (isDisliked ? 1 : -1))
    });
};

/**
 * Reports a community post.
 */
export const reportPost = async (postId, userId) => {
    const reportRef = collection(db, "post_reports");
    await addDoc(reportRef, {
        post_id: postId,
        reporter_id: userId,
        timestamp: serverTimestamp()
    });
};

// ─────────────────────────────────────────────────────
// Comment services
// ─────────────────────────────────────────────────────

/**
 * Fetches all comments for a given post (community post or report).
 */
export const getComments = async (postId) => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("report_id", "==", postId), orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toMillis ? d.data().timestamp.toMillis() : Date.now()
    }));
};

/**
 * Likes or unlikes a comment.
 */
export const toggleLikeComment = async (commentId, userId, isLiked) => {
    const commentRef = doc(db, "comments", commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    const current = snap.data().likes || 0;
    // Track per-user like in a subcollection to prevent double-liking
    const likeRef = doc(db, "comments", commentId, "likes", userId);
    if (isLiked) {
        await setDoc(likeRef, { liked_at: serverTimestamp() });
        await updateDoc(commentRef, { likes: current + 1 });
    } else {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likes: Math.max(0, current - 1) });
    }
};

/**
 * Dislikes or undislikes a comment.
 */
export const toggleDislikeComment = async (commentId, userId, isDisliked) => {
    const commentRef = doc(db, "comments", commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    const current = snap.data().dislikes || 0;
    await updateDoc(commentRef, {
        dislikes: Math.max(0, current + (isDisliked ? 1 : -1))
    });
};

/**
 * Reports a comment as inappropriate.
 */
export const reportComment = async (commentId, userId) => {
    const reportRef = collection(db, "comment_reports");
    await addDoc(reportRef, {
        comment_id: commentId,
        reporter_id: userId,
        timestamp: serverTimestamp()
    });
};
