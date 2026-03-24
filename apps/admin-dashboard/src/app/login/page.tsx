'use client';

import { useState } from 'react';
import { Anchor, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 1500));

    if (email === 'admin@boatly.com' && password === 'admin123') {
      window.location.href = '/dashboard';
    } else {
      setError('Invalid email or password. Try admin@boatly.com / admin123');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ocean-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ocean-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-ocean-500/25">
            <Anchor className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BOATLY</h1>
          <p className="text-slate-400 mt-1">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-admin-text">Welcome back</h2>
            <p className="text-sm text-admin-muted mt-1">
              Sign in to your admin account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@boatly.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-admin-border text-ocean-500 focus:ring-ocean-500"
                />
                <span className="text-sm text-admin-muted">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-ocean-500 hover:text-ocean-600 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-admin-border text-center">
            <p className="text-xs text-admin-muted">
              Demo credentials: admin@boatly.com / admin123
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; 2026 BOATLY. All rights reserved.
        </p>
      </div>
    </div>
  );
}
