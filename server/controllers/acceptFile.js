// Accept a file (set status to 'Accepted')
// @route   POST /api/files/:id/accept
// @access  Private (assigned user only)
exports.acceptFile = async (req, res) => {
  try {
    const file = await require('../models/File').findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    // Only assigned users can accept
    if (!Array.isArray(file.assignedTo) || !file.assignedTo.map(id => id.toString()).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this file' });
    }
    file.status = 'Accepted';
    await file.save();
    res.status(200).json({ success: true, message: 'File accepted', data: { status: file.status } });
  } catch (error) {
    console.error('Error in acceptFile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
