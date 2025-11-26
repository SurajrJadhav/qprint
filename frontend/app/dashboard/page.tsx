"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DashboardPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uniqueCode, setUniqueCode] = useState('');
    const [fileStatus, setFileStatus] = useState('');
    const [shops, setShops] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchShops();
    }, []);

    useEffect(() => {
        if (uniqueCode) {
            const interval = setInterval(checkFileStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [uniqueCode]);

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
        } catch (err) {
            console.error('Error fetching shops:', err);
        }
    };

    const checkFileStatus = async () => {
        try {
            const res = await api.get(`/file/${uniqueCode}/status`);
            setFileStatus(res.data.status);
        } catch (err) {
            console.error('Error checking status:', err);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload', formData);
            setUniqueCode(res.data.code);
            setFileStatus('uploaded');
        } catch (err: any) {
            alert('Upload failed: ' + (err.response?.data || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(uniqueCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-1">
                            Q<span className="text-pink-400">print</span>
                        </h1>
                        <p className="text-purple-200">Customer Dashboard</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-white/10 backdrop-blur-lg text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">📤</div>
                        <h2 className="text-2xl font-bold text-white">Upload Document</h2>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="relative">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full bg-white/20 border-2 border-dashed border-white/30 p-6 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-500 file:text-white file:font-semibold hover:file:bg-pink-600 cursor-pointer"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? '📤 Uploading...' : '📤 Upload File'}
                        </button>
                    </form>

                    {uniqueCode && (
                        <div className="mt-6 space-y-4">
                            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-400/30 rounded-lg p-6">
                                <p className="text-purple-200 text-sm mb-2">Your Unique Code</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-4xl font-black text-white tracking-wider">{uniqueCode}</p>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                                    >
                                        {copied ? '✅ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                                <div className="text-2xl">
                                    {fileStatus === 'downloaded' ? '✅' : '⏳'}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">
                                        Status: {fileStatus === 'downloaded' ? 'Downloaded' : 'Waiting for pickup'}
                                    </p>
                                    <p className="text-purple-200 text-sm">
                                        {fileStatus === 'downloaded'
                                            ? 'Your file has been collected!'
                                            : 'Share this code with the shopkeeper'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nearest Shops */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">🏪</div>
                        <h2 className="text-2xl font-bold text-white">Nearest Shops</h2>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {shops.length === 0 ? (
                            <div className="text-center py-12 text-purple-200">
                                <div className="text-5xl mb-4">🔍</div>
                                <p>No shops found nearby</p>
                            </div>
                        ) : (
                            shops.map((shop, index) => (
                                <div
                                    key={index}
                                    className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-semibold text-lg">{shop.username}</p>
                                            <p className="text-purple-200 text-sm">
                                                📍 {shop.distance?.toFixed(2)} km away
                                            </p>
                                        </div>
                                        <div className="text-3xl">🖨️</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* How it Works */}
            <div className="max-w-7xl mx-auto mt-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">📖 How it Works</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex gap-3">
                            <div className="text-2xl">1️⃣</div>
                            <div>
                                <p className="text-white font-semibold">Upload</p>
                                <p className="text-purple-200 text-sm">Choose and upload your document</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-2xl">2️⃣</div>
                            <div>
                                <p className="text-white font-semibold">Share Code</p>
                                <p className="text-purple-200 text-sm">Give the unique code to any shop</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-2xl">3️⃣</div>
                            <div>
                                <p className="text-white font-semibold">Collect</p>
                                <p className="text-purple-200 text-sm">Pick up your prints instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.7);
        }
      `}</style>
        </div>
    );
}
