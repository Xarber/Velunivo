const {label} = require('../lib/format');
async function refresh(){ const state = await api.app.read(); await api.ui.card({id:'download-demo',slot:'home',title:'Installed plugin',text:label(state.route?.meters)}); }
await refresh();
api.on('context', refresh);
