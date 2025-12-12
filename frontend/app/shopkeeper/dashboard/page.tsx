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
    const [view, setView] = useState<'dashboard' | 'history' | 'stats'>('dashboard');
    const [history, setHistory] = useState<any[]>([]);
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

    const fetchHistory = async () => {
        try {
            const res = await api.get('/shop/history');
            setHistory(res.data.history || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const handlePrint = async (code: string, isQueue = false, fileId?: number) => {
        if (!code && !isQueue) return;

        setDownloading(true);
        setMessage('');
        setMessageType('');

        try {
            let res;
            if (isQueue && fileId) {
                res = await api.get(`/queue/download/${fileId}`, { responseType: 'blob' });
            } else {
                res = await api.get(`/file/${code}`, { responseType: 'blob' });
            }

            // Create blob URL
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

            // Create iframe (using opacity instead of off-screen to ensure render)
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.bottom = '0';
            iframe.style.right = '0';
            iframe.style.width = '100px';
            iframe.style.height = '100px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            console.log("Iframe attached to DOM, setting src...");

            iframe.onload = () => {
                console.log("Iframe loaded PDF");
                setTimeout(() => {
                    console.log("Focusing and printing...");
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.error("Print call failed:", e);
                    }

                    // Show confirmation dialog after print dialog appears
                    setTimeout(async () => {
                        const didPrint = window.confirm('Did you complete printing?\n\nClick OK if you printed successfully.\nClick Cancel if you cancelled printing.');
                        console.log("User confirmation result:", didPrint);

                        if (didPrint) {
                            // Confirm print on backend (this deletes the file)
                            try {
                                if (isQueue && fileId) {
                                    await api.post(`/queue/${fileId}/confirm`);
                                    fetchQueue();
                                    setMessage('✅ Print confirmed! File deleted from server.');
                                } else {
                                    await api.post(`/file/${code}/confirm`);
                                    setMessage('✅ Print confirmed! File deleted from server.');
                                    setCode('');
                                }
                                setMessageType('success');
                            } catch (err) {
                                console.error('Confirm print error:', err);
                                setMessage('❌ Failed to confirm print.');
                                setMessageType('error');
                            }
                        } else {
                            // User cancelled - file remains available
                            setMessage('⚠️ Print cancelled. File is still available.');
                            setMessageType('');
                        }

                        // Cleanup
                        document.body.removeChild(iframe);
                        window.URL.revokeObjectURL(url);
                    }, 1000); // Check confirmation shortly after print dialog closes
                }, 1000); // Wait 1 second for PDF to render before printing
            };

            iframe.src = url;

        } catch (err: any) {
            console.error('Print error:', err);
            const status = err.response?.status;
            if (status === 410) {
                setMessage('⚠️ File already processed/deleted.');
            } else if (status === 404) {
                setMessage('❌ File not found.');
            } else {
                setMessage('❌ Failed to process file.');
            }
            setMessageType('error');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrivatePrintSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handlePrint(code);
    };

    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // ... (existing code)

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

                    {/* Profile Bubble */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-semibold hidden md:block">{username}</span>
                            <span className="text-purple-200">▼</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => { setView('dashboard'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>📊</span> Dashboard & Queue
                                    </button>
                                    <button
                                        onClick={() => { setView('history'); fetchHistory(); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>📜</span> Print History
                                    </button>
                                    <button
                                        onClick={() => { setView('stats'); fetchHistory(); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>📊</span> Stats & Earnings
                                    </button>
                                    <div className="h-px bg-white/10 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>🚪</span> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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

                {view === 'stats' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="text-4xl">📊</div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Earnings & Stats</h2>
                                <p className="text-purple-200 text-sm">Overview of your shop's performance</p>
                            </div>
                            <button
                                onClick={() => setView('dashboard')}
                                className="ml-auto px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {/* Total Earnings */}
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
                                <p className="text-green-200 text-sm mb-1">Total Earnings</p>
                                <h3 className="text-4xl font-bold text-white">
                                    ₹{history.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                                </h3>
                                <p className="text-white/60 text-xs mt-2">All time revenue</p>
                            </div>

                            {/* Today's Earnings */}
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                                <p className="text-blue-200 text-sm mb-1">Today's Earnings</p>
                                <h3 className="text-4xl font-bold text-white">
                                    ₹{history
                                        .filter(item => new Date(item.date).toDateString() === new Date().toDateString())
                                        .reduce((sum, item) => sum + item.cost, 0)
                                        .toFixed(2)}
                                </h3>
                                <p className="text-white/60 text-xs mt-2">Revenue generated today</p>
                            </div>

                            {/* Total Prints */}
                            <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-xl p-6">
                                <p className="text-pink-200 text-sm mb-1">Total Prints Solved</p>
                                <h3 className="text-4xl font-bold text-white">{history.length}</h3>
                                <p className="text-white/60 text-xs mt-2">Total files processed</p>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Table */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Recent Activity (Last 5)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/20 bg-white/5">
                                            <th className="text-left text-purple-200 font-semibold p-3 rounded-tl-lg">Date</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">Type</th>
                                            <th className="text-left text-purple-200 font-semibold p-3 rounded-tr-lg">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.slice(0, 5).map((item) => (
                                            <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                                                <td className="p-3 text-white text-sm">
                                                    {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'queue' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                                        }`}>
                                                        {item.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-green-300 font-bold text-sm">₹{item.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {view === 'history' ? (
                        <div className="col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-4xl">📜</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Print History</h2>
                                    <p className="text-purple-200 text-sm">Log of all completed prints</p>
                                </div>
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="ml-auto px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                                >
                                    ← Back to Dashboard
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/20">
                                            <th className="text-left text-purple-200 font-semibold p-3">Date</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">File Code</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">Type</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">Pages</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">Copies</th>
                                            <th className="text-left text-purple-200 font-semibold p-3">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-purple-300">
                                                    No history found. Print some files first!
                                                </td>
                                            </tr>
                                        ) : (
                                            history.map((item) => (
                                                <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="p-3 text-white">
                                                        {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                                                    </td>
                                                    <td className="p-3 text-white font-mono">{item.code}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'queue' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                                            }`}>
                                                            {item.type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-white">{item.pages}</td>
                                                    <td className="p-3 text-white">{item.copies}</td>
                                                    <td className="p-3 text-green-300 font-bold">₹{item.cost}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Private Print Section */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                                <div className="text-center mb-8">
                                    <div className="text-6xl mb-4">🖨️</div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Private Print</h2>
                                    <p className="text-purple-200">Print using unique code</p>
                                </div>

                                <form onSubmit={handlePrivatePrintSubmit} className="space-y-6">
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
                                        {downloading ? '⏳ Processing...' : '🖨️ Print Now'}
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
                                            <li>• Print dialog will appear when you click Print</li>
                                            <li>• Confirm completion after printing</li>
                                            <li>• Queue refreshes every 5 seconds</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Queue Table - Only show in Dashboard view */}
                {view === 'dashboard' && (
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
                                                        onClick={() => handlePrint('', true, job.id)}
                                                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                                                    >
                                                        🖨️ Print
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
