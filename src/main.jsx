import {createRoot} from 'react-dom/client'
import {GoogleOAuthProvider} from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/ui/AppErrorBoundary.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '795849511264-dbm3smkaqqg2770n0bnld0gncikfghc0.apps.googleusercontent.com'

// register firebase messaging service worker (non-blocking)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('SW registered with scope:', registration.scope);
        })
        .catch((err) => {
            console.error('SW registration failed:', err);
        });
}

// Global handler: detect dynamic-import failures (chunk load failures)
function handleChunkLoadFailure(reason) {
    try {
        const msg = reason && (reason.message || String(reason))
        if (msg && msg.includes('Failed to fetch dynamically imported module')) {
            console.warn('Detected dynamic import failure, attempting to clear service worker and caches then reload')
            // try to clear service workers and caches then reload
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister()))).catch(()=>{})
            }
            if (window.caches) {
                caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(()=>{})
            }
            // give cleanup a short moment then reload
            setTimeout(() => window.location.reload(), 800)
        }
    } catch (e) {
        console.warn('Error in chunk failure handler', e)
    }
}

window.addEventListener('unhandledrejection', (ev) => {
    handleChunkLoadFailure(ev.reason)
})
window.addEventListener('error', (ev) => {
    // some bundlers surface chunk load failures as runtime errors
    handleChunkLoadFailure(ev.error || ev.message)
})

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppErrorBoundary>
            <App/>
        </AppErrorBoundary>
    </GoogleOAuthProvider>
)
