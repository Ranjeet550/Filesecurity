const express = require('express');
const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/modules');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(checkPermission('user_management', 'read'), getModules)
  .post(checkPermission('user_management', 'create'), createModule);

router.route('/:id')
  .get(checkPermission('user_management', 'read'), getModule)
  .put(checkPermission('user_management', 'update'), updateModule)
  .delete(checkPermission('user_management', 'delete'), deleteModule);

module.exports = router;
