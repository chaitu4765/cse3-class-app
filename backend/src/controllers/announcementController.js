import db from '../config/firebase.js';

/**
 * Create Announcement Controller
 * Creates a new announcement
 * Access: CR only (JWT protected)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    // Validate request body
    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required'
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({
        message: 'Title cannot be empty'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        message: 'Message cannot be empty'
      });
    }

    // Create doc ref to get ID
    const newDocRef = db.collection('announcements').doc();
    const now = new Date().toISOString();

    const announcementData = {
      id: newDocRef.id,
      title: title.trim(),
      message: message.trim(),
      createdAt: now,
      updatedAt: now
    };

    await newDocRef.set(announcementData);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: announcementData
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      message: 'Server error while creating announcement in Firestore'
    });
  }
};

/**
 * Get Announcements Controller
 * Retrieves all announcements sorted by creation date (newest first)
 * Access: Public (students can view)
 */
export const getAnnouncements = async (req, res) => {
  try {
    const announcementsSnapshot = await db.collection('announcements').get();
    
    const announcements = [];
    announcementsSnapshot.forEach(doc => {
      const data = doc.data();
      announcements.push({
        id: data.id || doc.id,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt
      });
    });

    // Sort by createdAt descending
    announcements.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(200).json({
      count: announcements.length,
      announcements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      message: 'Server error while fetching announcements from Firestore'
    });
  }
};

/**
 * Delete Announcement Controller
 * Deletes an announcement by ID
 * Access: CR only (JWT protected)
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Announcement ID is required'
      });
    }

    const docRef = db.collection('announcements').doc(id);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({
        message: 'Announcement not found'
      });
    }

    await docRef.delete();

    res.status(200).json({
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      message: 'Server error while deleting announcement in Firestore'
    });
  }
};
