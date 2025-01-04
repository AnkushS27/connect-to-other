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
    const friends = await this.model('User').find({
        _id: { $in: this.friends }
    });
    
    const friendsOfFriends = new Set();
    const recommendationScores = new Map();
    
    for (const friend of friends) {
        const friendsFriend = await this.model('User').find({
            _id: { $in: friend.friends }
        });
        
        for (const potential of friendsFriend) {
            if (potential._id.toString() !== this._id.toString() && 
                !this.friends.includes(potential._id)) {
                friendsOfFriends.add(potential._id.toString());
                const currentScore = recommendationScores.get(potential._id.toString()) || 0;
                recommendationScores.set(potential._id.toString(), currentScore + 1);
            }
        }
    }
    
    const recommendations = await this.model('User').find({
        _id: { $in: Array.from(friendsOfFriends) }
    }).select('-password');
    
    return recommendations.sort((a, b) => 
        (recommendationScores.get(b._id.toString()) || 0) - 
        (recommendationScores.get(a._id.toString()) || 0)
    );
};

const User = mongoose.model('User', userSchema);
module.exports = User;