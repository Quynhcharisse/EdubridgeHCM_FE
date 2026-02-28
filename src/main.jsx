import {createRoot} from 'react-dom/client'
import {GoogleOAuthProvider} from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '795849511264-dbm3smkaqqg2770n0bnld0gncikfghc0.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App/>
    </GoogleOAuthProvider>
)
