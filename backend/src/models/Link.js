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
        trim: true,
        maxlength: [2048, 'URL is too long'],
        validate: {
            validator: function (v) {
                try {
                    const u = new URL(v);
                    return u.protocol === 'http:' || u.protocol === 'https:';
                } catch {
                    return false;
                }
            },
            message: 'Please provide a valid http:// or https:// URL'
        }
    },
    slug: {
        type: String,
        unique: true,
        required: true,
        // Provide a default NanoID if one is not specified
        default: () => nanoid(8),
        trim: true,
        lowercase: true,
        match: [/^[a-z0-9_-]+$/i, 'Slug may only contain letters, numbers, hyphens, and underscores'],
        minlength: [3, 'Slug must be at least 3 characters'],
        maxlength: [64, 'Slug cannot be more than 64 characters'],
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

module.exports = mongoose.model('Link', linkSchema);
