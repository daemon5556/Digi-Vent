import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Calendar, ArrowLeft, Check, AlertCircle, User, Shield, Users, Github } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'organizer' | 'volunteer' | '';
  phone: string;
  rememberMe: boolean;
  acceptTerms: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    rememberMe: false,
    acceptTerms: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, register, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const roles = [
    { 
      value: 'volunteer', 
      label: 'Volunteer', 
      icon: Users, 
      description: 'Help organize and support events' 
    },
    { 
      value: 'organizer', 
      label: 'Event Organizer', 
      icon: User, 
      description: 'Create and manage events' 
    },
    { 
      value: 'admin', 
      label: 'Administrator', 
      icon: Shield, 
      description: 'Full platform access and management' 
    }
  ];

  // Password strength calculation
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 20;
      if (/[A-Z]/.test(formData.password)) strength += 20;
      if (/[a-z]/.test(formData.password)) strength += 20;
      if (/[0-9]/.test(formData.password)) strength += 20;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 20;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Real-time validation
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (activeTab === 'register' && passwordStrength < 60) {
          newErrors.password = 'Password must be stronger';
        } else {
          delete newErrors.password;
        }
        break;

      case 'confirmPassword':
        if (activeTab === 'register') {
          if (!value) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (value !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;

      case 'fullName':
        if (activeTab === 'register') {
          if (!value) {
            newErrors.fullName = 'Full name is required';
          } else if (value.length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
          } else {
            delete newErrors.fullName;
          }
        }
        break;

      case 'role':
        if (!value) {
          newErrors.role = 'Please select your role';
        } else {
          delete newErrors.role;
        }
        break;

      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (type !== 'checkbox') {
      validateField(name, value);
    }

    // Clear auth error when user starts typing
    if (authError) {
      setAuthError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setAuthError('');
    setSuccessMessage('');

    // Validate all fields
    const fieldsToValidate = activeTab === 'login' 
      ? ['email', 'password', 'role']
      : ['fullName', 'email', 'password', 'confirmPassword', 'role'];

    fieldsToValidate.forEach(field => {
      validateField(field, formData[field as keyof FormData] as string);
    });

    // Check for terms acceptance in registration
    if (activeTab === 'register' && !formData.acceptTerms) {
      setErrors(prev => ({ ...prev, acceptTerms: 'You must accept the terms and conditions' }));
      setIsSubmitting(false);
      return;
    }

    // Check if there are any validation errors
    const hasErrors = Object.keys(errors).length > 0 || 
      (activeTab === 'register' && !formData.acceptTerms);

    if (hasErrors) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        // Handle login
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          setSuccessMessage('Login successful! Redirecting...');
          // Navigation is handled in useAuth hook
        } else {
          setAuthError(result.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // Handle registration
        const result = await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role as 'admin' | 'organizer' | 'volunteer',
          phone: formData.phone || undefined,
        });
        
        if (result.success) {
          setSuccessMessage('Registration successful! Please check your email to verify your account.');
          // Navigation is handled in useAuth hook for demo mode
        } else {
          setAuthError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    try {
      setAuthError('');
      setAuthError(`${provider} authentication is not available in demo mode. Please use email/password login.`);
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      setAuthError(`${provider} authentication failed. Please try again.`);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 80) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(79,70,229,0.02)_25%,rgba(79,70,229,0.02)_26%,transparent_27%,transparent_74%,rgba(79,70,229,0.02)_75%,rgba(79,70,229,0.02)_76%,transparent_77%)] bg-[length:60px_60px]" />
      
      {/* Header */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>
      </div>

      {/* Main Auth Container */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Digi-Vent</span>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'login' ? 'Welcome Back' : 'Join Digi-Vent'}
            </h1>
            <p className="text-gray-600">
              {activeTab === 'login' 
                ? 'Sign in to your account' 
                : 'Create your account to get started'}
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Registration-only fields */}
            {activeTab === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                      errors.fullName 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                  errors.email 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-indigo-500'
                }`}
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus={activeTab === 'login'}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone (Registration only) */}
            {activeTab === 'register' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                    errors.phone 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your phone number (optional)"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                    errors.password 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your password"
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator (Registration only) */}
              {activeTab === 'register' && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 40 ? 'text-red-600' :
                      passwordStrength < 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {activeTab === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                      errors.confirmPassword 
                        ? 'border-red-500 bg-red-50' 
                        : formData.confirmPassword && formData.confirmPassword === formData.password
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {formData.confirmPassword && formData.confirmPassword === formData.password && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Your Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                  errors.role 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-indigo-500'
                }`}
              >
                <option value="">Select your role</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Remember Me (Login only) */}
            {activeTab === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me for 30 days</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Terms Acceptance (Registration only) */}
            {activeTab === 'register' && (
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.acceptTerms}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isSubmitting || authLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting || authLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {authLoading ? 'Loading...' : activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                activeTab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSocialAuth('github')}
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
                <span className="ml-2">GitHub</span>
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setSuccessMessage('');
                  setErrors({});
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {activeTab === 'login' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
            <Shield className="w-4 h-4 mr-1" />
            <span>Secured with Supabase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;