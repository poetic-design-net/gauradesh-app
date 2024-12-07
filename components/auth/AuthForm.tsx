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
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [temples, setTemples] = useState<Temple[]>([]);
  const { signIn, signUp } = useAuth();
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
          description: 'Failed to load temples',
        });
      }
    }

    if (isSignUp) {
      loadTemples();
    }
  }, [isSignUp, toast]);

  async function onSubmit(values: SignUpValues | SignInValues) {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const signUpValues = values as SignUpValues;
        await signUp(
          signUpValues.email,
          signUpValues.password,
          signUpValues.displayName,
          signUpValues.templeId
        );
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-white text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </CardTitle>
        <CardDescription className="text-gray-200 text-center">
          {isSignUp
            ? 'Enter your details below to create your account'
            : 'Enter your email below to sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
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
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-200 hover:text-white"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
