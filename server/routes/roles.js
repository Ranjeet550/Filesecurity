const express = require('express');
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roles');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(checkPermission('user_management', 'read'), getRoles)
  .post(checkPermission('user_management', 'create'), createRole);

router.route('/:id')
  .get(checkPermission('user_management', 'read'), getRole)
  .put(checkPermission('user_management', 'update'), updateRole)
  .delete(checkPermission('user_management', 'delete'), deleteRole);

module.exports = router;
