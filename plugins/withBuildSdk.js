const { withGradleProperties } = require('@expo/config-plugins');
// CI selects the latest stable Android SDK from sdkmanager's channel 0.
module.exports = (config, options = {}) => withGradleProperties(config, mod => {
  const values = { 'android.compileSdkVersion': options.api, 'android.targetSdkVersion': options.api, 'android.buildToolsVersion': options.tools };
  for (const [key, value] of Object.entries(values)) if (value) {
    mod.modResults = mod.modResults.filter(p => p.type !== 'property' || p.key !== key);
    mod.modResults.push({ type: 'property', key, value: String(value) });
  }
  return mod;
});
