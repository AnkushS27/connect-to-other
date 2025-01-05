const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    interests: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to get friend recommendations
userSchema.methods.getFriendRecommendations = async function() {
    try {
        // Get current user's friends
        const friends = await this.model('User').find({
            _id: { $in: this.friends }
        });
        
        // Initialize sets and maps for tracking recommendations
        const friendsOfFriends = new Set();
        const recommendationScores = new Map();
        
        // Score based on mutual friends
        for (const friend of friends) {
            const friendsFriend = await this.model('User').find({
                _id: { $in: friend.friends }
            });
            
            for (const potential of friendsFriend) {
                if (potential._id.toString() !== this._id.toString() && 
                    !this.friends.includes(potential._id)) {
                    friendsOfFriends.add(potential._id.toString());
                    const currentScore = recommendationScores.get(potential._id.toString()) || 0;
                    recommendationScores.set(potential._id.toString(), currentScore + 3); // Weight for mutual friends
                }
            }
        }
        
        // Find users with common interests
        const usersWithCommonInterests = await this.model('User').find({
            _id: { $ne: this._id }, // Exclude current user
            _id: { $nin: this.friends }, // Exclude existing friends
            interests: { $in: this.interests } // Find users with matching interests
        });
        
        // Score based on common interests
        for (const user of usersWithCommonInterests) {
            const commonInterestsCount = this.interests.filter(interest => 
                user.interests.includes(interest)
            ).length;
            
            const currentScore = recommendationScores.get(user._id.toString()) || 0;
            recommendationScores.set(
                user._id.toString(), 
                currentScore + (commonInterestsCount * 2) // Weight for each common interest
            );
            friendsOfFriends.add(user._id.toString());
        }
        
        // Get all recommended users
        const recommendations = await this.model('User').find({
            _id: { $in: Array.from(friendsOfFriends) }
        })
        .select('-password')
        .populate('interests');
        
        // Sort recommendations by score
        return recommendations.sort((a, b) => {
            const scoreA = recommendationScores.get(a._id.toString()) || 0;
            const scoreB = recommendationScores.get(b._id.toString()) || 0;
            return scoreB - scoreA;
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;