import { useRouteError } from 'react-router-dom'
import { useEffect } from 'react'

const CHUNK_ERROR_PATTERNS = [
    'Failed to fetch dynamically imported module',
    'Unable to preload CSS',
    'Importing a module script failed',
    'Failed to load module script',
]

function isChunkError(error) {
    const msg = error?.message || String(error || '')
    return CHUNK_ERROR_PATTERNS.some(p => msg.includes(p))
}

async function clearCachesAndReload() {
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations().catch(() => [])
            await Promise.all(regs.map(r => r.unregister()))
        }
        if (window.caches) {
            const keys = await caches.keys().catch(() => [])
            await Promise.all(keys.map(k => caches.delete(k)))
        }
    } catch {
        // ignore cleanup errors
    }
    window.location.reload()
}

export default function ChunkErrorElement() {
    const error = useRouteError()

    useEffect(() => {
        if (isChunkError(error)) {
            clearCachesAndReload()
        }
    }, [error])

    if (isChunkError(error)) {
        return (
            <div style={{ padding: 20, fontFamily: 'Segoe UI, Roboto, sans-serif', textAlign: 'center', marginTop: 60 }}>
                <p>Đang tải phiên bản mới, vui lòng chờ...</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 20, fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
            <h2>Đã xảy ra lỗi</h2>
            <p>{String(error?.message || error)}</p>
            <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
    )
}
