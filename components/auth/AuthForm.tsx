'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getAllTemples, type Temple } from '../../lib/db/temples';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  templeId: z.string().min(1, 'Please select a temple'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpValues = z.infer<typeof signUpSchema>;
type SignInValues = z.infer<typeof signInSchema>;

export function AuthForm() {
  const [formLoading, setFormLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [selectedTempleId, setSelectedTempleId] = useState('');
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignUpValues | SignInValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && {
        displayName: '',
        templeId: '',
      }),
    },
  });

  useEffect(() => {
    // Reset form when switching between sign in and sign up
    form.reset({
      email: '',
      password: '',
      ...(isSignUp && {
        displayName: '',
        templeId: '',
      }),
    });
    // Reset selectedTempleId when switching modes
    setSelectedTempleId('');
  }, [isSignUp, form]);

  useEffect(() => {
    async function loadTemples() {
      try {
        const templesList = await getAllTemples();
        setTemples(templesList);
      } catch (error) {
        console.error('Error loading temples:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load temples. Please try again.',
        });
      }
    }

    // Only load temples in signup mode
    if (isSignUp) {
      loadTemples();
    }
  }, [isSignUp, toast]);

  const handleGoogleSignIn = async () => {
    if (formLoading || authLoading) return;
    
    // Only require temple selection in signup mode
    if (isSignUp && !selectedTempleId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a temple before signing in with Google.',
      });
      return;
    }

    try {
      setFormLoading(true);
      await signInWithGoogle(selectedTempleId, isSignUp);
      toast({
        title: 'Welcome!',
        description: 'You have successfully signed in with Google.',
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('popup-closed-by-user')) {
          errorMessage = 'Sign in cancelled. Please try again.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setFormLoading(false);
    }
  };

  async function onSubmit(values: SignUpValues | SignInValues) {
    if (formLoading || authLoading) return;
    setFormLoading(true);
    
    try {
      if (isSignUp) {
        const signUpValues = values as SignUpValues;
        await signUp(
          signUpValues.email,
          signUpValues.password,
          signUpValues.displayName,
          signUpValues.templeId
        );
        
        form.reset();
        setIsSignUp(false);
        
        toast({
          title: 'Account created successfully!',
          description: 'You can now sign in with your credentials.',
        });
      } else {
        const signInValues = values as SignInValues;
        await signIn(signInValues.email, signInValues.password);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Invalid email address.';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.message.includes('auth/user-not-found')) {
          errorMessage = 'No account found with this email.';
        } else if (error.message.includes('auth/wrong-password')) {
          errorMessage = 'Incorrect password.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Unable to create profile. Please try again or contact support.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setFormLoading(false);
    }
  }

  const isLoading = formLoading || authLoading;

  return (
    <div className="w-full">
      <CardHeader className="space-y-2 pt-6">
        <CardTitle className="text-xl text-white text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </CardTitle>
        <CardDescription className="text-gray-200 text-center">
          {isSignUp
            ? 'Enter your details below to create your account'
            : 'Enter your email below to sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="example@email.com" 
                      {...field}
                      className="bg-black/30 border-white/30 text-white placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
            {isSignUp && (
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Display Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your name" 
                        {...field}
                        className="bg-black/30 border-white/30 text-white placeholder:text-gray-400"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••" 
                      {...field}
                      className="bg-black/30 border-white/30 text-white placeholder:text-gray-400"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />
            {isSignUp && (
              <FormField
                control={form.control}
                name="templeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Temple</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTempleId(value);
                      }}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-black/30 border-white/30 text-white">
                          <SelectValue placeholder="Select a temple" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {temples.map((temple) => (
                          <SelectItem key={temple.id} value={temple.id}>
                            {temple.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
            )}
            <Button 
              type="submit" 
              className="w-full bg-white hover:bg-white/90 text-black border-white/20"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="rounded-full bg-background px-2">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full bg-transparent hover:bg-white/10 text-white hover:text-white border-white/20"
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => !isLoading && setIsSignUp(!isSignUp)}
            className="text-sm text-white hover:text-white/80"
            disabled={isLoading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
