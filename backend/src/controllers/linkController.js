const Link = require('../models/Link');

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
    let { originalUrl, title } = req.body;
    if (originalUrl) originalUrl = originalUrl.trim();
    if (title) title = title.trim();

    if (!originalUrl) {
        return res.status(400).json({ success: false, message: 'Please provide original URL' });
    }

    try {
        const link = await Link.create({
            title: title || '',
            originalUrl,
            user: req.user.id
        });
        res.status(201).json({ success: true, link });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update link (slug or originalUrl)
// @route   PUT /api/links/:id
// @access  Private
const updateLink = async (req, res) => {
    let { originalUrl, slug, title } = req.body;
    if (originalUrl) originalUrl = originalUrl.trim();
    if (slug) slug = slug.trim();
    if (title !== undefined) title = title.trim();

    try {
        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }

        if (link.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized to update this link' });
        }

        if (slug) {
            const existingSlug = await Link.findOne({ slug });
            if (existingSlug && existingSlug._id.toString() !== req.params.id) {
                return res.status(409).json({ success: false, message: 'This custom link is already taken.' });
            }
        }

        const updatedLink = await Link.findByIdAndUpdate(
            req.params.id,
            { ...(title !== undefined && { title }), originalUrl, slug },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, link: updatedLink });
    } catch (error) {
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

        // Check for user
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
        const link = await Link.findOne({ slug: req.params.slug });

        if (link) {
            // Increment clicks
            link.clicks++;
            await link.save();
            return res.redirect(302, link.originalUrl);
        } else {
            return res.status(404).json({ message: 'Link not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getLinks,
    createLink,
    updateLink,
    deleteLink,
    redirectLink
};
