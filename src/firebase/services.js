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
    GeoPoint,
    arrayUnion,
    arrayRemove,
    increment
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
    const newDoc = await addDoc(notificationsRef, {
        user_id: userId,
        message: notificationData.message,
        type: notificationData.type || "info",
        is_read: false,
        created_at: serverTimestamp()
    });
    return newDoc.id;
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
    // Convert { lat, lng } to a Firestore GeoPoint
    const location = reportData.location
        ? new GeoPoint(reportData.location.lat, reportData.location.lng)
        : null;

    const docRef = await addDoc(reportsRef, {
        title: reportData.title || 'New Incident',
        description: reportData.description || '',
        category: reportData.category || 'Analyzing...',
        location: location,
        // Human-readable location strings
        locationName: reportData.locationName || 'Location Unknown',
        areaName: reportData.areaName || 'Unknown Area',
        status: reportData.status || 'orange',
        // AI classification fields
        severity: reportData.severity || 'medium',
        radius: reportData.radius || 200,
        isFake: reportData.isFake || false,
        isSolved: reportData.isSolved || false,
        isClassifying: reportData.isClassifying ?? true,
        isUserMade: reportData.isUserMade ?? true,
        // Audience / sharing
        audienceIds: reportData.audienceIds || [],
        isPublic: reportData.isPublic !== false,
        // Ownership & time
        user_id: reportData.user_id,
        image: reportData.image || null,
        timestamp: serverTimestamp(),
        created_at: serverTimestamp(),
    });
    return docRef.id;
};

/**
 * Adds a comment to a report.
 */
export const addComment = async (reportId, userId, text, authorName) => {
    const commentsRef = collection(db, "comments");
    await addDoc(commentsRef, {
        report_id: reportId,
        user_id: userId,
        author: authorName || "Anonymous",
        text: text,
        timestamp: serverTimestamp()
    });

    try {
        const postRef = doc(db, "community_posts", reportId);
        await updateDoc(postRef, { comments: increment(1) });
    } catch (e) {
        try {
            const rRef = doc(db, "reports", reportId);
            await updateDoc(rRef, { comments: increment(1) });
        } catch (e2) {
            // Ignore if doc doesn't exist
        }
    }
};

/**
 * Fetches all reports.
 */
export const getReports = async () => {
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const loc = data.location
            ? { lat: data.location.latitude, lng: data.location.longitude }
            : null;
        return {
            id: doc.id,
            ...data,
            location: loc,
            // Convert Firestore Timestamps to JS milliseconds so timeAgo() and sorting work
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
            created_at: data.created_at?.toMillis ? data.created_at.toMillis() : undefined,
            // Always treat reports loaded from DB as not mid-classification
            isClassifying: false,
        };
    });
};

/**
 * Deletes a report from Firestore.
 */
export const deleteReport = async (reportId) => {
    const reportRef = doc(db, "reports", reportId);
    await deleteDoc(reportRef);
};

/**
 * Updates fields on an existing report in Firestore.
 */
export const updateReport = async (reportId, fields) => {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, { ...fields, updated_at: serverTimestamp() });
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
    if (isLiked) {
        await updateDoc(postRef, {
            likedBy: arrayUnion(userId),
            dislikedBy: arrayRemove(userId)
        });
    } else {
        await updateDoc(postRef, {
            likedBy: arrayRemove(userId)
        });
    }
};

/**
 * Dislikes or undislikes a community post.
 */
export const toggleDislikePost = async (postId, userId, isDisliked) => {
    const postRef = doc(db, "community_posts", postId);
    if (isDisliked) {
        await updateDoc(postRef, {
            dislikedBy: arrayUnion(userId),
            likedBy: arrayRemove(userId)
        });
    } else {
        await updateDoc(postRef, {
            dislikedBy: arrayRemove(userId)
        });
    }
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

    // Also save it locally on the post to persist UI state
    const postRef = doc(db, "community_posts", postId);
    await updateDoc(postRef, {
        reportedBy: arrayUnion(userId)
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
    if (isLiked) {
        await updateDoc(commentRef, {
            likedBy: arrayUnion(userId),
            dislikedBy: arrayRemove(userId)
        });
    } else {
        await updateDoc(commentRef, {
            likedBy: arrayRemove(userId)
        });
    }
};

/**
 * Dislikes or undislikes a comment.
 */
export const toggleDislikeComment = async (commentId, userId, isDisliked) => {
    const commentRef = doc(db, "comments", commentId);
    if (isDisliked) {
        await updateDoc(commentRef, {
            dislikedBy: arrayUnion(userId),
            likedBy: arrayRemove(userId)
        });
    } else {
        await updateDoc(commentRef, {
            dislikedBy: arrayRemove(userId)
        });
    }
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

    // Also save it locally on the comment to persist UI state
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, {
        reportedBy: arrayUnion(userId)
    });
};
