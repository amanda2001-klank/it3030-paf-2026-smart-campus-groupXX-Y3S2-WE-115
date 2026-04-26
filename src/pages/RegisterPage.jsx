import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import smartCampusBackground from '../assets/smart-campus-bg.svg';
import { getDashboardPathForRole, setAuthState } from '../utils/auth';

const resolveErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const CAMPUS_INSIGHTS = [
  { label: 'Fast Onboarding', value: '< 2 Minutes' },
  { label: 'Unified Access', value: 'All Modules' },
  { label: 'Secure Identity', value: 'Protected' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        userName: form.userName,
        email: form.email,
        password: form.password,
      });

      setAuthState(response.data);
      navigate(getDashboardPathForRole(response.data?.user?.userRole), { replace: true });
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_84%_18%,rgba(20,184,166,0.23),transparent_40%),linear-gradient(130deg,#041827_0%,#08263d_46%,#0d3048_100%)]" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `url(${smartCampusBackground})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="auth-visual-enter hidden min-h-[760px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-sm lg:flex">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/90">Smart Campus Access</p>
              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Create your workspace identity for smarter campus operations.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-sky-50/85">
                Join the platform to book resources faster, collaborate across teams, and stay updated with real-time facility insights.
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/30">
              <img
                src={smartCampusBackground}
                alt="Smart campus operations illustration"
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-medium text-white/95">Connected Learning Infrastructure</p>
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
                alt="Smart campus operations illustration"
                className="h-32 w-full rounded-xl object-cover"
              />
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Campus Access Network</p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-600">Smart Campus</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Create account</h2>
            <p className="mt-2 text-sm text-slate-600">Register to start managing smart campus resources with one secure account.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={form.userName}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
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
                  minLength={8}
                  value={form.password}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Re-enter password"
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
