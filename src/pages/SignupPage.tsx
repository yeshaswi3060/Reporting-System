import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SignupPageProps {
  onSwitchToLogin?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    occupation: '',
    company: '',
    website: '',
    bio: '',
    interests: '',
    newsletter: false,
    terms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { password, confirmPassword, ...userData } = formData;
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await signUp(formData.email, password, userData);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setError('');
    setIsLoading(true);
    
    try {
      if (provider === 'Google') {
        await signInWithGoogle();
      } else {
        throw new Error(`${provider} authentication is not implemented yet`);
      }
    } catch (err: any) {
      setError(err.message || `${provider} signup failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-7xl mx-auto h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 w-full h-full items-center">
            
            {/* Left side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center h-full animate-fade-in">
              <div className="max-w-md">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-emerald-900 bg-clip-text text-transparent mb-4 leading-tight">
                    Join our community
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Create your account and become part of our growing community.
                  </p>
                </div>
                
                {/* Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">Secure account</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">Instant access</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">Personalized experience</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Signup Form */}
            <div className="flex justify-center lg:justify-end h-full items-center animate-slide-up">
              <div className="w-full max-w-sm sm:max-w-md">
                <div className="bg-white/80 backdrop-blur-xl py-4 px-3 sm:py-6 sm:px-4 shadow-2xl rounded-2xl border border-white/20 relative overflow-hidden h-fit max-h-[90vh] overflow-y-auto">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-10 translate-x-10"></div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        Create your account
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Fill in your details to get started
                      </p>
                    </div>

                    {/* Social Signup Buttons */}
                    <div className="space-y-2 mb-3">
                      <button 
                        onClick={() => handleSocialSignup('Google')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group text-xs"
                      >
                        <svg className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </button>
                      
                      <button 
                        onClick={() => handleSocialSignup('Microsoft')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group text-xs"
                      >
                        <svg className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                          <path fill="#F25022" d="M1 1h10v10H1z"/>
                          <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                          <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                          <path fill="#FFB900" d="M13 13h10v10H13z"/>
                        </svg>
                        Sign up with Microsoft
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500 font-medium">Or fill out the form below</span>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                          {error}
                        </div>
                      )}

                      {/* Required Information Section */}
                      <div className="bg-green-50/50 p-2 rounded-lg border border-green-200/50">
                        <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Required Information
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="First name"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Last name"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Email"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Phone"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Password *
                            </label>
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Password"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Confirm *
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Confirm"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Optional Information Section */}
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-200/50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Optional Information
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Gender
                            </label>
                            <select
                              name="gender"
                              value={formData.gender}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="State"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              ZIP
                            </label>
                            <input
                              type="text"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="ZIP"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Country
                            </label>
                            <select
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                            >
                              <option value="">Select</option>
                              <option value="US">United States</option>
                              <option value="CA">Canada</option>
                              <option value="UK">United Kingdom</option>
                              <option value="AU">Australia</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Occupation
                            </label>
                            <input
                              type="text"
                              name="occupation"
                              value={formData.occupation}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-xs"
                              placeholder="Occupation"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            name="newsletter"
                            checked={formData.newsletter}
                            onChange={handleInputChange}
                            className="mt-0.5 w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <label className="text-xs text-gray-700">
                            I would like to receive newsletters and updates.
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            name="terms"
                            checked={formData.terms}
                            onChange={handleInputChange}
                            className="mt-0.5 w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            required
                          />
                          <label className="text-xs text-gray-700">
                            I agree to the <a href="#" className="text-green-600 hover:underline">Terms</a> and <a href="#" className="text-green-600 hover:underline">Privacy Policy</a> *
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm mt-3"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                          </div>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-600">
                        Already have an account?
                        <button 
                          onClick={() => onSwitchToLogin?.()}
                          className="ml-1 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};