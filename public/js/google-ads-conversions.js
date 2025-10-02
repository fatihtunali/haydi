/**
 * Google Ads Conversion Tracking Events
 * Call these functions when user completes important actions
 */

/**
 * Track user registration conversion
 */
function trackRegistrationConversion() {
    if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
            'send_to': 'AW-17618942258/KAYIT_CONVERSION_LABEL', // Google Ads'den alacaksınız
            'value': 1.0,
            'currency': 'TRY'
        });
        console.log('✅ Registration conversion tracked');
    }
}

/**
 * Track challenge participation conversion
 */
function trackChallengeJoinConversion() {
    if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
            'send_to': 'AW-17618942258/CHALLENGE_CONVERSION_LABEL', // Google Ads'den alacaksınız
            'value': 0.5,
            'currency': 'TRY'
        });
        console.log('✅ Challenge join conversion tracked');
    }
}

/**
 * Track submission conversion
 */
function trackSubmissionConversion() {
    if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
            'send_to': 'AW-17618942258/SUBMISSION_CONVERSION_LABEL', // Google Ads'den alacaksınız
            'value': 0.3,
            'currency': 'TRY'
        });
        console.log('✅ Submission conversion tracked');
    }
}

/**
 * Track generic conversion event
 * @param {string} eventName - Custom event name
 * @param {number} value - Event value
 */
function trackCustomConversion(eventName, value = 0) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, {
            'value': value,
            'currency': 'TRY'
        });
        console.log(`✅ Custom conversion tracked: ${eventName}`);
    }
}

// Export functions for use in other scripts
window.trackRegistrationConversion = trackRegistrationConversion;
window.trackChallengeJoinConversion = trackChallengeJoinConversion;
window.trackSubmissionConversion = trackSubmissionConversion;
window.trackCustomConversion = trackCustomConversion;
