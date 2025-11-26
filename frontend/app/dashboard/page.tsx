"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DashboardPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uniqueCode, setUniqueCode] = useState('');
    const [shops, setShops] = useState<any[]>([]);
    const [myFiles, setMyFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Print settings
    const [copies, setCopies] = useState(1);
    const [printMode, setPrintMode] = useState('single');
    const [colorMode, setColorMode] = useState('bw');
    const [paperSize, setPaperSize] = useState('A4');
    const [printType, setPrintType] = useState<'private' | 'queue'>('private');
    const [selectedShop, setSelectedShop] = useState('');

    // Upload response
    const [numPages, setNumPages] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);

    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchShops();
        fetchMyFiles();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
        } catch (err) {
            console.error('Error fetching shops:', err);
        }
    };

    const fetchMyFiles = async () => {
        try {
            const res = await api.get('/my-files');
            setMyFiles(res.data.files || []);
        } catch (err) {
            console.error('Error fetching files:', err);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        if (printType === 'queue' && !selectedShop) {
            alert('Please select a shop for queue print');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('print_type', printType);
        formData.append('copies', copies.toString());
        formData.append('print_mode', printMode);
        formData.append('color_mode', colorMode);
        formData.append('paper_size', paperSize);
        if (printType === 'queue') {
            formData.append('shop_id', selectedShop);
        }

        try {
            const res = await api.post('/upload', formData);
            setNumPages(res.data.num_pages);
            setTotalCost(res.data.total_cost);
            if (printType === 'private') {
                setUniqueCode(res.data.code);
            } else {
                setQueuePosition(res.data.queue_position);
            }
            fetchMyFiles(); // Refresh file list
            setFile(null); // Reset form
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

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Upload Section */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">📤</div>
                        <h2 className="text-2xl font-bold text-white">Upload Document</h2>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-6">
                        {/* File Input */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Select File</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full bg-white/20 border-2 border-dashed border-white/30 p-6 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-500 file:text-white file:font-semibold hover:file:bg-pink-600 cursor-pointer"
                                required
                            />
                        </div>

                        {/* Print Settings */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-white font-semibold mb-2">Copies</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={copies}
                                    onChange={(e) => setCopies(parseInt(e.target.value))}
                                    className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Print Mode</label>
                                <select
                                    value={printMode}
                                    onChange={(e) => setPrintMode(e.target.value)}
                                    className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="single">Single-sided</option>
                                    <option value="double">Double-sided</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Color</label>
                                <select
                                    value={colorMode}
                                    onChange={(e) => setColorMode(e.target.value)}
                                    className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="bw">Black & White</option>
                                    <option value="color">Color</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Paper Size</label>
                                <select
                                    value={paperSize}
                                    onChange={(e) => setPaperSize(e.target.value)}
                                    className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="A4">A4</option>
                                    <option value="Letter">Letter</option>
                                </select>
                            </div>
                        </div>

                        {/* Print Type Selection */}
                        <div>
                            <label className="block text-white font-semibold mb-3">Print Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPrintType('private')}
                                    className={`p-4 rounded-lg border-2 transition-all ${printType === 'private'
                                            ? 'bg-pink-500/30 border-pink-400'
                                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">🔒</div>
                                    <div className="text-white font-bold">Private Print</div>
                                    <div className="text-purple-200 text-sm">Get unique code</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPrintType('queue')}
                                    className={`p-4 rounded-lg border-2 transition-all ${printType === 'queue'
                                            ? 'bg-pink-500/30 border-pink-400'
                                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">📋</div>
                                    <div className="text-white font-bold">Queue Print</div>
                                    <div className="text-purple-200 text-sm">Send to shop queue</div>
                                </button>
                            </div>
                        </div>

                        {/* Shop Selector (for queue prints) */}
                        {printType === 'queue' && (
                            <div>
                                <label className="block text-white font-semibold mb-2">Select Shop</label>
                                <select
                                    value={selectedShop}
                                    onChange={(e) => setSelectedShop(e.target.value)}
                                    className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    required
                                >
                                    <option value="">Choose a shop...</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.username} - {shop.distance?.toFixed(2)} km away
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? '📤 Uploading...' : `📤 Upload ${printType === 'private' ? '& Get Code' : 'to Queue'}`}
                        </button>
                    </form>

                    {/* Success Message - Private Print */}
                    {uniqueCode && printType === 'private' && (
                        <div className="mt-6 space-y-4">
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-lg p-6">
                                <p className="text-green-200 text-sm mb-2">✅ Upload Successful!</p>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-purple-200 text-xs">Pages</p>
                                        <p className="text-white font-bold text-lg">{numPages}</p>
                                    </div>
                                    <div>
                                        <p className="text-purple-200 text-xs">Copies</p>
                                        <p className="text-white font-bold text-lg">{copies}</p>
                                    </div>
                                    <div>
                                        <p className="text-purple-200 text-xs">Total Cost</p>
                                        <p className="text-white font-bold text-lg">₹{totalCost}</p>
                                    </div>
                                </div>
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
                        </div>
                    )}

                    {/* Success Message - Queue Print */}
                    {queuePosition !== null && printType === 'queue' && (
                        <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-lg p-6">
                            <p className="text-green-200 text-sm mb-4">✅ Added to Queue!</p>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-purple-200 text-xs">Queue Position</p>
                                    <p className="text-white font-bold text-2xl">#{queuePosition}</p>
                                </div>
                                <div>
                                    <p className="text-purple-200 text-xs">Pages</p>
                                    <p className="text-white font-bold text-lg">{numPages}</p>
                                </div>
                                <div>
                                    <p className="text-purple-200 text-xs">Copies</p>
                                    <p className="text-white font-bold text-lg">{copies}</p>
                                </div>
                                <div>
                                    <p className="text-purple-200 text-xs">Total Cost</p>
                                    <p className="text-white font-bold text-lg">₹{totalCost}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* My Files */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">📁</div>
                        <h2 className="text-2xl font-bold text-white">My Files</h2>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {myFiles.length === 0 ? (
                            <div className="text-center py-12 text-purple-200">
                                <div className="text-5xl mb-4">📄</div>
                                <p>No files uploaded yet</p>
                            </div>
                        ) : (
                            myFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="bg-white/10 rounded-lg p-4 border border-white/20"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">
                                                    {file.print_type === 'private' ? '🔒' : '📋'}
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {file.print_type === 'private' ? 'Private Print' : 'Queue Print'}
                                                </span>
                                                {file.print_type === 'private' && (
                                                    <span className="text-pink-400 font-mono text-lg">{file.code}</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <span className="text-purple-300">Pages:</span>
                                                    <span className="text-white ml-1">{file.num_pages}</span>
                                                </div>
                                                <div>
                                                    <span className="text-purple-300">Copies:</span>
                                                    <span className="text-white ml-1">{file.copies}</span>
                                                </div>
                                                <div>
                                                    <span className="text-purple-300">Mode:</span>
                                                    <span className="text-white ml-1">{file.print_mode}</span>
                                                </div>
                                                <div>
                                                    <span className="text-purple-300">Cost:</span>
                                                    <span className="text-white ml-1">₹{file.total_cost}</span>
                                                </div>
                                            </div>

                                            {file.print_type === 'queue' && file.shop_name && (
                                                <div className="mt-2 text-sm">
                                                    <span className="text-purple-300">Shop:</span>
                                                    <span className="text-white ml-1">{file.shop_name}</span>
                                                    {file.queue_position && (
                                                        <>
                                                            <span className="text-purple-300 ml-3">Position:</span>
                                                            <span className="text-pink-400 ml-1 font-bold">#{file.queue_position}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${file.status === 'downloaded'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                {file.status === 'downloaded' ? '✅ Downloaded' : '⏳ Pending'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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
