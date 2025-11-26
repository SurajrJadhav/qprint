"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ShopkeeperDashboard() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'shopkeeper') {
            router.push('/login');
        }
    }, []);

    const handleDownload = async () => {
        try {
            // We use window.open or create a link to download because it's a file
            // But we need to hit the API endpoint.
            // Since the endpoint is protected or public? The plan said public for download by code.
            // Let's check main.go. It is public: r.Get("/file/{code}", handlers.DownloadFile)

            window.open(`http://localhost:8080/file/${code}`, '_blank');
            setError('');
        } catch (err) {
            setError('Failed to download. Check code.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-3xl font-bold mb-8">Shopkeeper Dashboard</h1>

            <div className="w-full max-w-md p-6 border rounded bg-white/10">
                <h2 className="text-xl font-bold mb-4">Download Customer File</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter Unique Code"
                        className="flex-1 p-2 rounded text-black"
                    />
                    <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded">
                        Download
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
}
