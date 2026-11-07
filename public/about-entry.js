// SPDX-License-Identifier: AGPL-3.0-only
// The host validates both origin and the exact iframe window before opening the app.
for(const link of document.querySelectorAll('[data-open-app]'))link.addEventListener('click',event=>{
 try{window.localStorage.setItem('velunivo-web-opened-v1','true');}catch{/* The explicit openApp URL also works with storage disabled. */}
 if(window.parent!==window){event.preventDefault();window.parent.postMessage('velunivo:open-web-app',window.location.origin);}
});
