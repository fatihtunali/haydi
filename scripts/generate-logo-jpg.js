const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Convert SVG logo to JPG format
 * Creates multiple sizes for different uses
 */

const sizes = [
    { name: 'google-ads', size: 1200 },
    { name: 'medium', size: 600 },
    { name: 'small', size: 300 }
];

const svgPath = path.join(__dirname, '../public/assets/images/logo-icon.svg');
const outputDir = path.join(__dirname, '../public/assets/images/logos');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function convertSVGtoJPG() {
    console.log('🎨 SVG to JPG conversion started...\n');

    try {
        // Read SVG file
        const svgBuffer = fs.readFileSync(svgPath);

        for (const { name, size } of sizes) {
            const outputPath = path.join(outputDir, `logo-${name}-${size}x${size}.jpg`);

            await sharp(svgBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
                })
                .jpeg({
                    quality: 95,
                    chromaSubsampling: '4:4:4'
                })
                .toFile(outputPath);

            console.log(`✅ Created: ${name} (${size}x${size}) - ${outputPath}`);
        }

        console.log('\n🎉 All logos created successfully!\n');
        console.log('📁 Output directory:', outputDir);
        console.log('\n📋 Files created:');
        console.log('   - logo-google-ads-1200x1200.jpg (Use this for Google Ads!)');
        console.log('   - logo-medium-600x600.jpg');
        console.log('   - logo-small-300x300.jpg');
        console.log('\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

convertSVGtoJPG()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
