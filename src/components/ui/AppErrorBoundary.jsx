import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {error: null}
  }

  static getDerivedStateFromError(error) {
    return {error}
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught error', error, info)
  }

  clearSWAndReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
      if (window.caches) {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
    } catch (e) {
      console.warn('Failed clearing SW/cache', e)
    } finally {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{padding:20,fontFamily:'Segoe UI, Roboto, sans-serif'}}>
        <h2>Ứng dụng gặp lỗi bất ngờ</h2>
        <p>Trình duyệt không thể tải phần mã được tách (code-split). Thử làm mới trang để lấy phiên bản mới.</p>
        <div style={{marginTop:12}}>
          <button onClick={() => window.location.reload()}>Làm mới</button>
          <button style={{marginLeft:8}} onClick={this.clearSWAndReload}>Làm mới và xóa cache</button>
        </div>
        <pre style={{marginTop:12,color:'#a00'}}>{String(this.state.error)}</pre>
      </div>
    )
  }
}
