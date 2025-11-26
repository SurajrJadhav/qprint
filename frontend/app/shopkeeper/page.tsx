"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ShopkeeperPage() {
    const [code, setCode] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, []);

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setDownloading(true);
        setMessage('');
        setMessageType('');

        try {
            const res = await api.get(`/file/${code}`, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qprint-${code}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage('✅ File downloaded successfully! File has been deleted from server.');
            setMessageType('success');
            setCode('');
        } catch (err: any) {
            console.error('Download error:', err);
            if (err.response?.status === 410) {
                setMessage('⚠️ This file has already been downloaded and is no longer available.');
            } else if (err.response?.status === 404) {
                setMessage('❌ Invalid code. Please check and try again.');
            } else {
                setMessage('❌ Download failed. Please try again.');
            }
            setMessageType('error');
        } finally {
            setDownloading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-1">
                            Q<span className="text-pink-400">print</span>
                        </h1>
                        <p className="text-purple-200">Shopkeeper Dashboard</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-white/10 backdrop-blur-lg text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🖨️</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Download Customer File</h2>
                        <p className="text-purple-200">Enter the unique code provided by the customer</p>
                    </div>

                    <form onSubmit={handleDownload} className="space-y-6">
                        <div>
                            <label className="block text-white font-semibold mb-2">Unique Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter 6-character code"
                                maxLength={6}
                                autoComplete="off"
                                spellCheck="false"
                                className="w-full bg-white/20 border-2 border-white/30 p-4 rounded-lg text-white text-center text-2xl font-bold tracking-widest placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={code.length !== 6 || downloading}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {downloading ? '⏳ Downloading...' : '📥 Download File'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg ${messageType === 'success'
                                ? 'bg-green-500/20 border border-green-400/30 text-green-100'
                                : 'bg-red-500/20 border border-red-400/30 text-red-100'
                            }`}>
                            <p className="font-semibold">{message}</p>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">ℹ️</div>
                            <h3 className="text-xl font-bold text-white">How it Works</h3>
                        </div>
                        <ol className="space-y-3 text-purple-200">
                            <li className="flex gap-2">
                                <span className="text-pink-400 font-bold">1.</span>
                                <span>Customer provides 6-character code</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400 font-bold">2.</span>
                                <span>Enter code and click download</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400 font-bold">3.</span>
                                <span>File downloads and gets deleted</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400 font-bold">4.</span>
                                <span>Print and hand over to customer</span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">🔒</div>
                            <h3 className="text-xl font-bold text-white">Security</h3>
                        </div>
                        <ul className="space-y-3 text-purple-200">
                            <li className="flex gap-2">
                                <span className="text-pink-400">✓</span>
                                <span>One-time download only</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400">✓</span>
                                <span>File auto-deleted after download</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400">✓</span>
                                <span>Unique codes for each file</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-pink-400">✓</span>
                                <span>Secure encrypted connection</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-pink-400/30">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">💡</div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Quick Tips</h3>
                            <ul className="space-y-2 text-purple-200">
                                <li>• Enter code exactly as shown (case-sensitive)</li>
                                <li>• Each code can only be used once for security</li>
                                <li>• Files are automatically deleted after download</li>
                                <li>• If download fails, ask customer to re-upload</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
