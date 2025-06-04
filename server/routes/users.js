const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/')
  .get(checkPermission('user_management', 'read'), getUsers)
  .post(checkPermission('user_management', 'create'), createUser);

router.route('/:id')
  .get(checkPermission('user_management', 'read'), getUser)
  .put(checkPermission('user_management', 'update'), updateUser)
  .delete(checkPermission('user_management', 'delete'), deleteUser);

module.exports = router;
