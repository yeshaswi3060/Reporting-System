import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SocialAuthButton } from './SocialAuthButton';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginCredentials, SignupCredentials, SocialAuthProvider } from '../../types/auth';

const socialProviders: SocialAuthProvider[] = [
  { name: 'google', label: 'Google', icon: '', color: '#4285F4' },
  { name: 'microsoft', label: 'Microsoft', icon: '', color: '#00A4EF' },
  { name: 'apple', label: 'Apple', icon: '', color: '#000000' }
];

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };
        await signIn(credentials.email, credentials.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        const credentials: SignupCredentials = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        };
        await signUp(credentials.email, credentials.password, { firstName: credentials.name.split(' ')[0] || '', lastName: credentials.name.split(' ').slice(1).join(' ') || '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    setError('');
    setIsLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        throw new Error(`${provider} login not yet supported`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to your account to continue' 
              : 'Sign up to get started with our platform'
            }
          </p>
        </div>

        {/* Social Auth Buttons */}
        <div className="space-y-3 mb-6">
          {socialProviders.map((provider) => (
            <SocialAuthButton
              key={provider.name}
              provider={provider}
              onClick={() => handleSocialLogin(provider.name)}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isLogin && (
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
