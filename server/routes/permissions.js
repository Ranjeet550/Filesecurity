const express = require('express');
const {
  getPermissions,
  getPermission,
  getPermissionsByModule,
  createPermission,
  updatePermission,
  deletePermission
} = require('../controllers/permissions');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(checkPermission('user_management', 'read'), getPermissions)
  .post(checkPermission('user_management', 'create'), createPermission);

router.route('/module/:moduleId')
  .get(checkPermission('user_management', 'read'), getPermissionsByModule);

router.route('/:id')
  .get(checkPermission('user_management', 'read'), getPermission)
  .put(checkPermission('user_management', 'update'), updatePermission)
  .delete(checkPermission('user_management', 'delete'), deletePermission);

module.exports = router;
