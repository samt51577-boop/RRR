const axios = require('axios');

exports.getHandicap = async (req, res) => {
    const { memberId } = req.params;
    const apiKey = process.env.GOLF_GENIUS_API_KEY;
    // Base URL for Golf Genius API v2
    const url = `https://www.golfgenius.com/api/v2/members/${memberId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`, // Set API key in request header
                'Content-Type': 'application/json'
            }
        });
        
        // Extract handicap index or other golfer details
        res.status(200).json({
            name: response.data.name,
            handicap_index: response.data.handicap_index
        });
    } catch (error) {
        console.error('Golf Genius API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch handicap data' });
    }
};
