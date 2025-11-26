"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [file, setFile] = useState<File | null>(null);
    const [code, setCode] = useState('');
    const [shops, setShops] = useState<any[]>([]);
    const [status, setStatus] = useState('');
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'customer') {
            router.push('/login');
        }
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCode(res.data.code);
            setStatus('uploaded');
            pollStatus(res.data.code);
        } catch (err) {
            console.error('Upload failed', err);
        }
    };

    const pollStatus = (code: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/file/${code}/status`);
                setStatus(res.data.status);
                if (res.data.status === 'downloaded') {
                    clearInterval(interval);
                }
            } catch (err) {
                clearInterval(interval);
            }
        }, 2000);
    };

    return (
        <div className="flex min-h-screen flex-col p-24">
            <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>

            <div className="mb-8 p-6 border rounded bg-white/10">
                <h2 className="text-xl font-bold mb-4">Upload File</h2>
                <input type="file" onChange={handleFileChange} className="mb-4" />
                <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Get Unique ID
                </button>

                {code && (
                    <div className="mt-4">
                        <p className="text-lg">Your Unique Code: <span className="font-bold text-yellow-400 text-2xl">{code}</span></p>
                        <p>Status: <span className={status === 'downloaded' ? 'text-green-500' : 'text-gray-400'}>{status}</span></p>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Nearest Shops</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shops.map((shop) => (
                        <div key={shop.id} className="p-4 border rounded bg-white/5">
                            <h3 className="font-bold">{shop.username}</h3>
                            <p>Distance: {(shop.distance * 111).toFixed(2)} km</p> {/* Approx conversion */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
