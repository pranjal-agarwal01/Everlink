const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const linkSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
        default: ''
    },
    originalUrl: {
        type: String,
        required: [true, 'Please provide the original URL'],
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            'Please provide a valid HTTP/HTTPS URL'
        ]
    },
    slug: {
        type: String,
        unique: true,
        required: true,
        // Provide a default NanoID if one is not specified
        default: () => nanoid(8),
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // A link must belong to a user
    },
    clicks: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure slugs are indexed for ultra-fast lookup
linkSchema.index({ slug: 1 });

module.exports = mongoose.model('Link', linkSchema);
