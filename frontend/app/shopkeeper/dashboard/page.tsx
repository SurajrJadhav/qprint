"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ShopkeeperPage() {
    const [code, setCode] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [queue, setQueue] = useState<any[]>([]);
    const [username, setUsername] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        setUsername(localStorage.getItem('username') || 'Shopkeeper');
        fetchQueue();
        // Refresh queue every 5 seconds
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/queue');
            setQueue(res.data.queue || []);
        } catch (err) {
            console.error('Error fetching queue:', err);
        }
    };

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

    const handleQueueDownload = async (fileId: number) => {
        try {
            const res = await api.get(`/queue/download/${fileId}`, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qprint-queue-${fileId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Refresh queue
            fetchQueue();
            setMessage('✅ Queue file downloaded successfully!');
            setMessageType('success');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            console.error('Queue download error:', err);
            setMessage('❌ Failed to download queue file.');
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
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
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-1">
                            Q<span className="text-pink-400">print</span>
                        </h1>
                        <p className="text-purple-200">Welcome, {username}!</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-white/10 backdrop-blur-lg text-white rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Global Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${messageType === 'success'
                        ? 'bg-green-500/20 border border-green-400/30 text-green-100'
                        : 'bg-red-500/20 border border-red-400/30 text-red-100'
                        }`}>
                        <p className="font-semibold">{message}</p>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Private Print Section */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🔒</div>
                            <h2 className="text-3xl font-bold text-white mb-2">Private Print</h2>
                            <p className="text-purple-200">Download using unique code</p>
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
                    </div>

                    {/* Queue Info */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">📋</div>
                            <h2 className="text-3xl font-bold text-white mb-2">Print Queue</h2>
                            <p className="text-purple-200">Files waiting in your queue</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-200 text-sm">Total in Queue</p>
                                        <p className="text-white font-bold text-3xl">{queue.length}</p>
                                    </div>
                                    <div className="text-4xl">📊</div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-400/30 rounded-lg p-4">
                                <p className="text-white font-semibold mb-2">💡 Queue Tips</p>
                                <ul className="text-purple-200 text-sm space-y-1">
                                    <li>• Files are shown in order (FIFO)</li>
                                    <li>• Download any file from the queue</li>
                                    <li>• Files auto-delete after download</li>
                                    <li>• Queue refreshes every 5 seconds</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">📋</div>
                        <h2 className="text-2xl font-bold text-white">Queue Files</h2>
                        <span className="ml-auto bg-pink-500/30 text-pink-200 px-3 py-1 rounded-full text-sm font-semibold">
                            {queue.length} files
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        {queue.length === 0 ? (
                            <div className="text-center py-12 text-purple-200">
                                <div className="text-5xl mb-4">📭</div>
                                <p>No files in queue</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left text-purple-200 font-semibold p-3">#</th>
                                        <th className="text-left text-purple-200 font-semibold p-3">Customer</th>
                                        <th className="text-left text-purple-200 font-semibold p-3">File</th>
                                        <th className="text-left text-purple-200 font-semibold p-3">Settings</th>
                                        <th className="text-left text-purple-200 font-semibold p-3">Cost</th>
                                        <th className="text-left text-purple-200 font-semibold p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.map((job, index) => (
                                        <tr key={job.id} className="border-b border-white/10 hover:bg-white/5">
                                            <td className="p-3">
                                                <span className="text-pink-400 font-bold text-lg">#{job.queue_position}</span>
                                            </td>
                                            <td className="p-3">
                                                <p className="text-white font-semibold">{job.customer_name}</p>
                                                <p className="text-purple-300 text-xs">
                                                    {new Date(job.created_at).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="p-3">
                                                <p className="text-white text-sm">{job.filename}</p>
                                                <p className="text-purple-300 text-xs">{job.num_pages} pages</p>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-white text-sm space-y-1">
                                                    <div>📄 {job.copies} copies</div>
                                                    <div>🔄 {job.print_mode}</div>
                                                    <div>🎨 {job.color_mode}</div>
                                                    <div>📏 {job.paper_size}</div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <p className="text-white font-bold text-lg">₹{job.total_cost}</p>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => handleQueueDownload(job.id)}
                                                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                                                >
                                                    📥 Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
