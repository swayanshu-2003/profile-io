const express = require('express');
const { createOrUpdateProfile, listProfiles, getProfile,getMyProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/profile', authMiddleware, createOrUpdateProfile);
router.get('/profiles', listProfiles);
router.get('/profile/:id', getProfile);
router.get('/my-profile',authMiddleware, getMyProfile);

module.exports = router;