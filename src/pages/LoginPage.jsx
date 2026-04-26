import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginUser } from '../services/authService';
import smartCampusBackground from '../assets/smart-campus-bg.svg';
import { getDashboardPathForRole, setAuthState } from '../utils/auth';

const resolveErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const resolveGoogleErrorMessage = (error) => {
  if (!error?.response) {
    return 'Google sign-in failed because backend is unreachable. Start the API server on http://localhost:8080.';
  }

  const message = error.response?.data?.message || '';
  if (message.toLowerCase().includes('audience mismatch')) {
    return 'Google client ID mismatch. Ensure the same client ID is configured in frontend and backend and this origin is allowed in Google Cloud.';
  }

  return resolveErrorMessage(error, 'Google sign-in failed. Please try again.');
};

const CAMPUS_INSIGHTS = [
  { label: '24/7 Availability', value: 'Always On' },
  { label: 'Live Space Status', value: 'Real-Time' },
  { label: 'Secure Access', value: 'Role-Based' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const completeLogin = (responseData) => {
    setAuthState(responseData);
    navigate(getDashboardPathForRole(responseData?.user?.userRole), { replace: true });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
      });
      completeLogin(response.data);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setErrorMessage('Google login did not return a token. Please try again.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const response = await loginWithGoogle(credentialResponse.credential);
      completeLogin(response.data);
    } catch (error) {
      setErrorMessage(resolveGoogleErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_88%_15%,rgba(45,212,191,0.22),transparent_40%),linear-gradient(135deg,#031525_0%,#08243b_48%,#0d2f49_100%)]" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `url(${smartCampusBackground})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="auth-visual-enter hidden min-h-[740px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-sm lg:flex">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/90">Smart Campus Workspace</p>
              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Everything your campus needs in one intelligent workspace.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-sky-50/85">
                Plan and manage rooms, equipment, and service workflows with confidence from a single connected platform.
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/30">
              <img
                src={smartCampusBackground}
                alt="Smart campus building network illustration"
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-medium text-white/95">Digital Operations Center</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {CAMPUS_INSIGHTS.map((insight) => (
                <div key={insight.label} className="rounded-xl border border-white/30 bg-white/15 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-100/75">{insight.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{insight.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="auth-card-enter relative mx-auto w-full max-w-xl rounded-[2rem] border border-white/65 bg-white/95 p-6 shadow-[0_26px_70px_-34px_rgba(7,45,82,0.9)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

            <div className="mb-6 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-3 lg:hidden">
              <img
                src={smartCampusBackground}
                alt="Smart campus building network illustration"
                className="h-32 w-full rounded-xl object-cover"
              />
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Smart Campus Control Layer</p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-600">Smart Campus</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to manage bookings, assets, and real-time facility operations.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter your password"
                />
              </div>

              {errorMessage ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50/95 px-3 py-2 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:from-sky-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setErrorMessage(
                    'Google sign-in was blocked. Ensure this origin is added to Authorized JavaScript origins in Google Cloud.'
                  )
                }
              />
            </div>

            <p className="mt-7 text-center text-sm text-slate-600">
              Need an account?{' '}
              <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                Create one
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
