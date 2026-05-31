const Link = require('../models/Link');

// Slugs that would shadow real backend routes (/api/*, /health) or common
// well-known paths. Custom slugs matching these are rejected.
const RESERVED_SLUGS = new Set([
    'api', 'health', 'login', 'register', 'dashboard', 'admin',
    'assets', 'static', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);

// Normalize a URL — add https:// if the user typed a bare host like "example.com"
const normalizeUrl = (url) => {
    if (!url) return url;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
};

// @desc    Get all links for a user
// @route   GET /api/links
// @access  Private
const getLinks = async (req, res) => {
    try {
        const links = await Link.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, links });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new link
// @route   POST /api/links
// @access  Private
const createLink = async (req, res) => {
    let { originalUrl, title, slug } = req.body;
    if (originalUrl) originalUrl = normalizeUrl(originalUrl);
    if (title) title = String(title).trim();
    if (slug) slug = String(slug).trim().toLowerCase();

    if (!originalUrl) {
        return res.status(400).json({ success: false, message: 'Please provide a destination URL' });
    }

    try {
        if (slug) {
            if (RESERVED_SLUGS.has(slug)) {
                return res.status(400).json({ success: false, message: 'This slug is reserved. Please choose another.' });
            }
            const existing = await Link.findOne({ slug });
            if (existing) {
                return res.status(409).json({ success: false, message: 'This custom link is already taken.' });
            }
        }

        const link = await Link.create({
            title: title || '',
            originalUrl,
            ...(slug && { slug }),
            user: req.user.id,
        });
        res.status(201).json({ success: true, link });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Validation failed';
            return res.status(400).json({ success: false, message: msg });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'This custom link is already taken.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update link (slug, originalUrl, title)
// @route   PUT /api/links/:id
// @access  Private
const updateLink = async (req, res) => {
    let { originalUrl, slug, title } = req.body;
    if (originalUrl) originalUrl = normalizeUrl(originalUrl);
    if (slug !== undefined) slug = String(slug).trim().toLowerCase();
    if (title !== undefined) title = String(title).trim();

    try {
        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }

        if (link.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized to update this link' });
        }

        if (slug) {
            if (RESERVED_SLUGS.has(slug)) {
                return res.status(400).json({ success: false, message: 'This slug is reserved. Please choose another.' });
            }
            const existingSlug = await Link.findOne({ slug });
            if (existingSlug && existingSlug._id.toString() !== req.params.id) {
                return res.status(409).json({ success: false, message: 'This custom link is already taken.' });
            }
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (originalUrl) updates.originalUrl = originalUrl;
        if (slug) updates.slug = slug;

        const updatedLink = await Link.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, link: updatedLink });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Validation failed';
            return res.status(400).json({ success: false, message: msg });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'This custom link is already taken.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete link
// @route   DELETE /api/links/:id
// @access  Private
const deleteLink = async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }

        if (link.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized to delete this link' });
        }

        await link.deleteOne();
        res.status(200).json({ success: true, id: req.params.id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Redirect to original URL
// @route   GET /:slug
// @access  Public
const redirectLink = async (req, res) => {
    try {
        // Atomic increment — avoids race conditions on concurrent hits
        const link = await Link.findOneAndUpdate(
            { slug: String(req.params.slug).toLowerCase() },
            { $inc: { clicks: 1 } },
            { new: false }
        );

        if (link) {
            return res.redirect(302, link.originalUrl);
        }
        return res.status(404).json({ success: false, message: 'Link not found' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getLinks,
    createLink,
    updateLink,
    deleteLink,
    redirectLink,
};
