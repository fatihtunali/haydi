const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * Dynamic sitemap.xml generator
 * Returns XML sitemap with all public pages and challenges
 */
router.get('/sitemap.xml', async (req, res) => {
    try {
        // Get all active challenges
        const [challenges] = await pool.query(`
            SELECT id, updated_at, created_at
            FROM challenges
            WHERE status = 'aktif'
            ORDER BY id DESC
        `);

        // Get all categories
        const [categories] = await pool.query(`
            SELECT slug, name
            FROM categories
            ORDER BY id
        `);

        const baseUrl = 'https://haydihepberaber.com';
        const now = new Date().toISOString();

        // Build XML sitemap
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage - highest priority
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Challenges listing page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/challenges</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.9</priority>\n';
        xml += '  </url>\n';

        // Leaderboard page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/leaderboard</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';

        // Login page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/login</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.5</priority>\n';
        xml += '  </url>\n';

        // Register page
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/register</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.5</priority>\n';
        xml += '  </url>\n';

        // Legal pages
        const legalPages = ['privacy-policy', 'kvkk', 'terms', 'cookies'];
        legalPages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/${page}</loc>\n`;
            xml += `    <lastmod>${now}</lastmod>\n`;
            xml += '    <changefreq>yearly</changefreq>\n';
            xml += '    <priority>0.3</priority>\n';
            xml += '  </url>\n';
        });

        // Individual challenge pages
        challenges.forEach(challenge => {
            const lastmod = challenge.updated_at || challenge.created_at;
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/challenge/${challenge.id}</loc>\n`;
            xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        // Set appropriate headers
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(xml);

    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
});

module.exports = router;
