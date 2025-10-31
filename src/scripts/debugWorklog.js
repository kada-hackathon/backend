const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');
const User = require('../models/User');
require('dotenv').config();

async function debugWorkLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Check ALL worklogs across all users
        const totalCount = await WorkLog.countDocuments({});
        console.log(`📊 Total WorkLogs in database: ${totalCount}`);

        // Count worklogs WITH embeddings
        const withEmbeddings = await WorkLog.countDocuments({ 
            embedding: { $exists: true, $ne: null }
        });
        console.log(`✅ WorkLogs with embeddings: ${withEmbeddings}`);

        // Count worklogs WITHOUT embeddings
        const withoutEmbeddings = await WorkLog.countDocuments({ 
            $or: [
                { embedding: { $exists: false } },
                { embedding: null }
            ]
        });
        console.log(`❌ WorkLogs without embeddings: ${withoutEmbeddings}\n`);

        // Get sample worklogs from ALL users
        const samples = await WorkLog.find({})
            .populate('user', 'name division')
            .select('title datetime tag embedding user')
            .limit(20)
            .sort({ datetime: -1 })
            .lean();

        console.log('📝 Sample WorkLogs from all users:');
        samples.forEach((log, idx) => {
            const hasEmbedding = log.embedding && log.embedding.length > 0;
            const embeddingInfo = hasEmbedding ? `✓ (${log.embedding.length} dims)` : '✗ No embedding';
            const userName = log.user?.name || 'Unknown User';
            console.log(`  ${idx + 1}. ${log.title} by ${userName} - ${embeddingInfo}`);
        });

        // Check if vector index exists
        console.log('\n🔍 Checking collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        const worklogCollection = collections.find(c => c.name === 'worklogs');
        console.log('WorkLogs collection exists:', !!worklogCollection);

        // Count by user
        console.log('\n👥 WorkLogs per user:');
        const userCounts = await WorkLog.aggregate([
            {
                $group: {
                    _id: '$user',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $project: {
                    userName: { $arrayElemAt: ['$userInfo.name', 0] },
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        userCounts.forEach(user => {
            console.log(`  ${user.userName || 'Unknown'}: ${user.count} logs`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugWorkLogs();