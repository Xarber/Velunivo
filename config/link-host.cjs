/** Only HTTPS origins can be verified. This shared helper must also load in Expo's config evaluator. */
function verifiedLinkHost(origin) { try { const url = new URL(origin); return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.pathname === '/' && !url.search && !url.hash ? url.hostname : undefined; } catch { return undefined; } }
module.exports = { verifiedLinkHost };
