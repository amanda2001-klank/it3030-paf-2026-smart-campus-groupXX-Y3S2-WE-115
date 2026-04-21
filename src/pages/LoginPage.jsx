import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginUser } from '../services/authService';
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Smart Campus</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Access bookings and catalogue management tools.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your password"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
