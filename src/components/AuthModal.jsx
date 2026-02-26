import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthModal({ onClose, onLogin }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'google'

    // Login form
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    // Signup form
    const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleGoogleLogin = () => {
        // Simulate Google login
        onLogin({
            username: 'Google User',
            email: 'user@gmail.com',
            avatar: 'GO',
            loginMethod: 'google',
        });
        onClose();
    };

    const handlePasswordLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!loginForm.username.trim() || !loginForm.password.trim()) {
            setError('Please enter your username and password.');
            return;
        }
        // Check localStorage for registered users
        const users = JSON.parse(localStorage.getItem('urbansafe_users') || '[]');
        const found = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
        if (!found) {
            setError('Invalid username or password.');
            return;
        }
        onLogin({ username: found.username, email: found.email, avatar: found.username.slice(0, 2).toUpperCase(), loginMethod: 'password' });
        onClose();
    };

    const handleSignup = (e) => {
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
        const users = JSON.parse(localStorage.getItem('urbansafe_users') || '[]');
        if (users.find(u => u.username === username)) {
            setError('Username already taken. Please choose another.');
            return;
        }
        users.push({ username, email, password });
        localStorage.setItem('urbansafe_users', JSON.stringify(users));
        setSuccess('Account created! You can now log in.');
        setTimeout(() => { setSuccess(''); setMode('login'); }, 1500);
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
                    <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
                        <X size={20} />
                    </button>
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
                        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={iconStyle} />
                                <input style={inputStyle} placeholder="Username" value={loginForm.username}
                                    onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Password" type={showPassword ? 'text' : 'password'}
                                    value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <button type="submit" className="btn-orange" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                                Log In
                            </button>
                        </form>
                    )}

                    {/* SIGN UP */}
                    {mode === 'signup' && (
                        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={iconStyle} />
                                <input style={inputStyle} placeholder="Username" value={signupForm.username}
                                    onChange={e => setSignupForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input style={inputStyle} placeholder="Email address" type="email" value={signupForm.email}
                                    onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Password (min. 6 chars)" type={showPassword ? 'text' : 'password'}
                                    value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="Confirm password" type={showConfirm ? 'text' : 'password'}
                                    value={signupForm.confirmPassword} onChange={e => setSignupForm(p => ({ ...p, confirmPassword: e.target.value }))} autoComplete="new-password" />
                                <button type="button" onClick={() => setShowConfirm(p => !p)}
                                    style={{ all: 'unset', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <button type="submit" className="btn-orange" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                                Create Account
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
