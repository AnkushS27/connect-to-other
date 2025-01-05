import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, UserMinus } from 'lucide-react';

const Home = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriends();
        fetchRecommendations();
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/friends', {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            const data = await response.json();
            setFriends(data.friends);
            setFriendRequests(data.friendRequests);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/recommendations', {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            const data = await response.json();
            setRecommendations(data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/users/search?q=${searchQuery}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            await fetch(`http://localhost:5000/api/users/friend-request/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            setSearchResults(searchResults.filter(user => user._id !== userId));
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const acceptFriendRequest = async (userId) => {
        try {
            await fetch(`http://localhost:5000/api/users/accept-request/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            await fetchFriends();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const removeFriend = async (userId) => {
        try {
            await fetch(`http://localhost:5000/api/users/friends/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            await fetchFriends();
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {searchResults.map(result => (
                            <div key={result._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{result.username}</span>
                                <button
                                    onClick={() => sendFriendRequest(result._id)}
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
                    <div className="space-y-2">
                        {friendRequests.map(request => (
                            <div key={request._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{request.username}</span>
                                <button
                                    onClick={() => acceptFriendRequest(request._id)}
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                    Accept
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Friends</h2>
                <div className="space-y-2">
                    {friends.map(friend => (
                        <div key={friend._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{friend.username}</span>
                            <button
                                onClick={() => removeFriend(friend._id)}
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                                <UserMinus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recommended Friends</h2>
                <div className="space-y-2">
                    {recommendations.map(recommendation => (
                        <div key={recommendation._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{recommendation.username}</span>
                            <button
                                onClick={() => sendFriendRequest(recommendation._id)}
                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;