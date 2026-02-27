import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import {
    signInUser,
    signUpUser,
    signInWithGoogle,
    setUserProfile,
    addNotification
} from '../firebase/services';

export default function AuthModal({ onClose, onLogin, forceMode = false }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [isLoading, setIsLoading] = useState(false);

    // Login form
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    // Signup form
    const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = await signInWithGoogle();
            // Sync profile
            const profile = {
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: (user.displayName || 'U').slice(0, 2).toUpperCase(),
                role: 'user',
                reputation_score: 100,
            };
            await setUserProfile(user.uid, profile);
            onLogin({ ...profile, uid: user.uid });
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!loginForm.email.trim() || !loginForm.password.trim()) {
            setError('Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        try {
            const user = await signInUser(loginForm.email, loginForm.password);
            // In a real app, we'd fetch the profile from Firestore here. 
            // App.jsx will handle the persistent state via onAuthChange.
            onClose();
        } catch (err) {
            console.error(err);
            setError('Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        const { username, email, password, confirmPassword } = signupForm;
        if (!username.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        setIsLoading(true);
        try {
            const user = await signUpUser(email, password);
            // Create profile
            const profile = {
                username,
                email,
                avatar: username.slice(0, 2).toUpperCase(),
                role: 'user',
                reputation_score: 100,
                created_at: new Date()
            };
            await setUserProfile(user.uid, profile);

            setSuccess('Account created! You can now log in.');
            setTimeout(() => { setSuccess(''); setMode('login'); }, 1500);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use.');
            } else {
                setError(err.message || 'Failed to create account.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px 11px 40px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
        borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    };
    const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 24, width: 420, maxWidth: '94vw', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '28px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {mode === 'login' ? 'Sign in to UrbanSafe AI' : 'Join the UrbanSafe community'}
                        </p>
                    </div>
                    {!forceMode && (
                        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div style={{ padding: '24px 28px 28px' }}>
                    {/* Mode tabs */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 22, border: '1px solid var(--glass-border)' }}>
                        {['login', 'signup'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    background: mode === m ? 'var(--accent-orange)' : 'transparent',
                                    color: mode === m ? '#fff' : 'var(--text-secondary)'
                                }}>
                                {m === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(238,66,102,0.12)', border: '1px solid rgba(238,66,102,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#ff8080', fontSize: 13 }}>
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(81,222,161,0.12)', border: '1px solid rgba(81,222,161,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#80ffd4', fontSize: 13 }}>
                            <CheckCircle size={15} /> {success}
                        </div>
                    )}

                    {/* LOGIN */}
                    {mode === 'login' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={iconStyle} />
                                    <input style={inputStyle} placeholder="Email address" type="email" value={loginForm.email}
                                        onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" disabled={isLoading} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={iconStyle} />
                                    <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Password" type={showPassword ? 'text' : 'password'}
                                        value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" disabled={isLoading} />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                <button type="submit" className="btn-orange" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={isLoading}>
                                    {isLoading ? 'Signing in...' : 'Log In'}
                                </button>
                            </form>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>OR</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                            </div>

                            <button onClick={handleGoogleLogin} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }} disabled={isLoading}>
                                <svg width="18" height="18" viewBox="0 0 18 18">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4" />
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.56c-.829.556-1.89.885-3.048.885-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34a853" />
                                    <path d="M3.964 10.734c-.18-.54-.282-1.117-.282-1.734s.102-1.194.282-1.734V4.934H.957a8.996 8.996 0 000 8.132l3.007-2.332z" fill="#fbbc05" />
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.017.957 4.934L3.964 7.266C4.672 5.139 6.656 3.58 9 3.58z" fill="#ea4335" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    )}

                    {/* SIGN UP */}
                    {mode === 'signup' && (
                        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={iconStyle} />
                                <input style={inputStyle} placeholder="Username" value={signupForm.username}
                                    onChange={e => setSignupForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" disabled={isLoading} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input style={inputStyle} placeholder="Email address" type="email" value={signupForm.email}
                                    onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" disabled={isLoading} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Password (min. 6 chars)" type={showPassword ? 'text' : 'password'}
                                    value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" disabled={isLoading} />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Confirm password" type={showConfirm ? 'text' : 'password'}
                                    value={signupForm.confirmPassword} onChange={e => setSignupForm(p => ({ ...p, confirmPassword: e.target.value }))} autoComplete="new-password" disabled={isLoading} />
                                <button type="button" onClick={() => setShowConfirm(p => !p)}
                                    style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <button type="submit" className="btn-orange" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
