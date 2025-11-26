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
        setError(''); // Clear previous errors
        try {
            await api.post('/register', { username, password, role, lat, long });
            router.push('/login');
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.response) {
                // Backend returned an error
                setError(err.response.data || 'Registration failed');
            } else if (err.request) {
                // Request made but no response (backend not running)
                setError('Cannot connect to server. Is the backend running?');
            } else {
                // Something else happened
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
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-3xl font-bold mb-8">Register</h1>
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
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border p-2 rounded text-black"
                >
                    <option value="customer">Customer</option>
                    <option value="shopkeeper">Shopkeeper</option>
                </select>

                {role === 'shopkeeper' && (
                    <button type="button" onClick={getLocation} className="bg-gray-500 text-white p-2 rounded text-sm">
                        Get Current Location
                    </button>
                )}
                {role === 'shopkeeper' && (
                    <div className="text-xs">Lat: {lat.toFixed(4)}, Long: {long.toFixed(4)}</div>
                )}

                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="bg-green-500 text-white p-2 rounded">Register</button>
            </form>
            <p className="mt-4">
                Already have an account? <Link href="/login" className="text-blue-500">Login</Link>
            </p>
        </div>
    );
}
