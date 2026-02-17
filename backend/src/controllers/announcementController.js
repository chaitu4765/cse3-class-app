import Announcement from '../models/Announcement.js';

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

    // Validate title and message lengths
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

    // Create new announcement
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim()
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: {
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        createdAt: announcement.createdAt
      }
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      message: 'Server error while creating announcement'
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
    // Fetch all announcements, sorted by newest first
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'message', 'createdAt'],
      raw: true,
    });

    res.status(200).json({
      count: announcements.length,
      announcements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      message: 'Server error while fetching announcements'
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

    // Find and delete the announcement
    const deletedCount = await Announcement.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      message: 'Server error while deleting announcement'
    });
  }
};
