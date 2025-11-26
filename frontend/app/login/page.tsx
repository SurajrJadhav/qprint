"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const res = await api.post('/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);

            if (res.data.role === 'shopkeeper') {
                router.push('/shopkeeper');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response) {
                setError(err.response.data || 'Invalid credentials');
            } else if (err.request) {
                setError('Cannot connect to server. Is the backend running?');
            } else {
                setError('Login failed: ' + err.message);
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-3xl font-bold mb-8">Login</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 rounded text-black"
                    required
                />
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Login</button>
            </form>
            <p className="mt-4">
                Don't have an account? <Link href="/register" className="text-blue-500">Register</Link>
            </p>
        </div>
    );
}
