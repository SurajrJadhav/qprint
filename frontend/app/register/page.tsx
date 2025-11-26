"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [lat, setLat] = useState(0);
    const [long, setLong] = useState(0);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/register', { username, password, role, lat, long });
            router.push('/login');
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.response) {
                setError(err.response.data || 'Registration failed');
            } else if (err.request) {
                setError('Cannot connect to server. Is the backend running?');
            } else {
                setError('Registration failed: ' + err.message);
            }
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLat(position.coords.latitude);
                setLong(position.coords.longitude);
            });
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white mb-2">
                        Q<span className="text-pink-400">print</span>
                    </h1>
                    <p className="text-purple-200">Create your account</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-white/20 border border-white/30 p-3 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/20 border border-white/30 p-3 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="customer" className="bg-purple-900">Customer</option>
                            <option value="shopkeeper" className="bg-purple-900">Shopkeeper</option>
                        </select>

                        {role === 'shopkeeper' && (
                            <>
                                <button
                                    type="button"
                                    onClick={getLocation}
                                    className="bg-white/20 text-white p-3 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300"
                                >
                                    📍 Get Current Location
                                </button>
                                {(lat !== 0 || long !== 0) && (
                                    <div className="text-purple-200 text-sm bg-white/10 p-3 rounded-lg">
                                        Location: {lat.toFixed(4)}, {long.toFixed(4)}
                                    </div>
                                )}
                            </>
                        )}

                        {error && <p className="text-pink-300 bg-red-500/20 p-3 rounded-lg">{error}</p>}

                        <button
                            type="submit"
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold p-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Create Account
                        </button>
                    </form>

                    <p className="mt-6 text-center text-purple-200">
                        Already have an account?{' '}
                        <Link href="/login" className="text-pink-400 hover:text-pink-300 font-semibold">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
