const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, interests } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            interests
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
        
        res.status(201).json({ token, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
        
        res.json({ token, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Search Users
router.get('/search', auth, async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const users = await User.find({
            username: { $regex: searchQuery, $options: 'i' },
            _id: { $ne: req.userId }
        }).select('-password');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
});

// Send Friend Request
router.post('/friend-request/:id', auth, async (req, res) => {
    try {
        const recipient = await User.findById(req.params.id);
        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (recipient.friendRequests.includes(req.userId)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }
        
        recipient.friendRequests.push(req.userId);
        await recipient.save();
        
        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request' });
    }
});

// Accept Friend Request
router.post('/accept-request/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const requester = await User.findById(req.params.id);
        
        if (!user || !requester) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.friendRequests = user.friendRequests.filter(
            id => id.toString() !== req.params.id
        );
        
        user.friends.push(req.params.id);
        requester.friends.push(req.userId);
        
        await user.save();
        await requester.save();
        
        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request' });
    }
});

// Get Friend Recommendations
router.get('/recommendations', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const recommendations = await user.getFriendRecommendations();
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: 'Error getting recommendations' });
    }
});

// Get Friends List
router.get('/friends', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', '-password')
            .populate('friendRequests', '-password');
        
        res.json({
            friends: user.friends,
            friendRequests: user.friendRequests
        });
    } catch (error) {
        res.status(500).json({ message: 'Error getting friends list' });
    }
});

// Remove Friend
router.delete('/friends/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const friend = await User.findById(req.params.id);
        
        if (!user || !friend) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.friends = user.friends.filter(
            id => id.toString() !== req.params.id
        );
        friend.friends = friend.friends.filter(
            id => id.toString() !== req.userId
        );
        
        await user.save();
        await friend.save();
        
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing friend' });
    }
});

module.exports = router;