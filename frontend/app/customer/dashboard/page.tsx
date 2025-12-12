"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
});

export default function DashboardPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uniqueCode, setUniqueCode] = useState('');
    const [shops, setShops] = useState<any[]>([]);
    const [myFiles, setMyFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'dashboard' | 'expenses' | 'history' | 'favorites'>('dashboard');
    const [favorites, setFavorites] = useState<number[]>([]);

    useEffect(() => {
        // Load favorites
        const saved = localStorage.getItem('favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    const toggleFavorite = (shopId: number) => {
        const newFavs = favorites.includes(shopId)
            ? favorites.filter(id => id !== shopId)
            : [...favorites, shopId];
        setFavorites(newFavs);
        localStorage.setItem('favorites', JSON.stringify(newFavs));
    };

    // Print settings
    const [copies, setCopies] = useState(1);
    const [printMode, setPrintMode] = useState('single');
    const [colorMode, setColorMode] = useState('bw');
    const [paperSize, setPaperSize] = useState('A4');
    const [printType, setPrintType] = useState<'private' | 'queue'>('private');
    const [selectedShop, setSelectedShop] = useState('');
    const [username, setUsername] = useState('');

    // User location
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLong, setUserLong] = useState<number | null>(null);

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
        setUsername(localStorage.getItem('username') || 'Customer');

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLat(position.coords.latitude);
                setUserLong(position.coords.longitude);
                fetchShops();
            }, (error) => {
                console.error('Error getting location:', error);
                // Fallback to showing shops anyway
                fetchShops();
            });
        } else {
            fetchShops();
        }

        fetchMyFiles();

        // Refresh files every 5 seconds to update status
        const interval = setInterval(fetchMyFiles, 5000);
        return () => clearInterval(interval);
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

    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // ... (existing code)

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
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

    const handleReset = () => {
        setUniqueCode('');
        setQueuePosition(null);
        setFile(null);
        setNumPages(0);
        setTotalCost(0);
    };

    // ... (existing code)

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
                                        onClick={() => { setView('expenses'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>💸</span> Expense Tracker
                                    </button>
                                    <button
                                        onClick={() => { setView('history'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>📂</span> File History
                                    </button>
                                    <button
                                        onClick={() => { setView('favorites'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>⭐</span> Favorite Shops
                                    </button>
                                    <button
                                        onClick={() => { setView('dashboard'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                    >
                                        <span>🏠</span> Dashboard
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
                {/* Upload Section */}
                {view === 'dashboard' && (
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
                                        <option value="single" className="text-black">Single-sided</option>
                                        <option value="double" className="text-black">Double-sided</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white font-semibold mb-2">Color</label>
                                    <select
                                        value={colorMode}
                                        onChange={(e) => setColorMode(e.target.value)}
                                        className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        <option value="bw" className="text-black">Black & White</option>
                                        <option value="color" className="text-black">Color</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white font-semibold mb-2">Paper Size</label>
                                    <select
                                        value={paperSize}
                                        onChange={(e) => setPaperSize(e.target.value)}
                                        className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        <option value="A4" className="text-black">A4</option>
                                        <option value="Letter" className="text-black">Letter</option>
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
                                    <label className="block text-white font-semibold mb-2">Select Shop (Top 5 Nearest)</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedShop}
                                            onChange={(e) => setSelectedShop(e.target.value)}
                                            className="w-full bg-white/20 border border-white/30 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 max-h-40"
                                            required
                                            size={Math.min(shops.length + 1, 6)}
                                        >
                                            <option value="" className="text-black">Choose a shop...</option>

                                            {/* Show Favorites at top if any */}
                                            {shops.filter(s => favorites.includes(s.id)).length > 0 && (
                                                <optgroup label="--- Favorites ---" className="text-pink-600 font-bold">
                                                    {shops.filter(s => favorites.includes(s.id)).map((shop) => (
                                                        <option key={'fav-' + shop.id} value={shop.id} className="text-black font-semibold">
                                                            ⭐ {shop.username} - {shop.distance?.toFixed(2)} km
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}

                                            <optgroup label="--- All Shops ---">
                                                {shops.slice(0, 5).map((shop) => (
                                                    <option key={shop.id} value={shop.id} className="text-black">
                                                        {favorites.includes(shop.id) ? '⭐ ' : '🏪 '} {shop.username} - {shop.distance?.toFixed(2)} km
                                                    </option>
                                                ))}
                                            </optgroup>

                                            {shops.length > 5 && (
                                                <optgroup label="--- More Shops ---" className="text-gray-500">
                                                    {shops.slice(5).map((shop) => (
                                                        <option key={shop.id} value={shop.id} className="text-black">
                                                            {favorites.includes(shop.id) ? '⭐ ' : '🏪 '} {shop.username} - {shop.distance?.toFixed(2)} km
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => selectedShop && toggleFavorite(parseInt(selectedShop))}
                                            className={`px-4 rounded-lg border transition-all text-xl ${selectedShop && favorites.includes(parseInt(selectedShop))
                                                    ? 'bg-pink-500 border-pink-500 text-white'
                                                    : 'bg-white/10 border-white/30 text-white/50 hover:bg-white/20 hover:text-white'
                                                }`}
                                            disabled={!selectedShop}
                                            title={selectedShop ? "Toggle Favorite" : "Select a shop first"}
                                        >
                                            {selectedShop && favorites.includes(parseInt(selectedShop)) ? '⭐' : '🤍'}
                                        </button>
                                    </div>
                                    <p className="text-purple-200 text-xs mt-1">Showing top 5 nearest shops first. Scroll for more.</p>
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
                                    <button
                                        onClick={handleReset}
                                        className="w-full mt-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 font-semibold"
                                    >
                                        🔄 Upload Another File
                                    </button>
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
                                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-400/30 rounded-lg p-6 text-center">
                                    <p className="text-blue-200 text-sm mb-2">Sent to Queue</p>
                                    <p className="text-4xl font-black text-white mb-2">#{queuePosition}</p>
                                    <p className="text-white/60 text-sm">Your position in queue</p>

                                    {/* Navigate Button */}
                                    {(() => {
                                        const shop = shops.find(s => s.id.toString() === selectedShop.toString());
                                        if (shop && shop.lat && shop.long) {
                                            return (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.long}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
                                                >
                                                    🧭 Navigate to Shop
                                                </a>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <button
                                        onClick={handleReset}
                                        className="w-full mt-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 font-semibold"
                                    >
                                        🔄 Upload Another File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Expense Tracker View */}
                {view === 'expenses' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="text-4xl">💸</div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Expense Tracker</h2>
                                <p className="text-purple-200 text-sm">Track your printing expenses</p>
                            </div>
                            <button
                                onClick={() => setView('dashboard')}
                                className="ml-auto px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 border border-red-500/30 rounded-xl p-6">
                                <p className="text-pink-200 text-sm mb-1">Total Spent</p>
                                <h3 className="text-4xl font-bold text-white">
                                    ₹{myFiles
                                        .filter(f => f.status === 'downloaded')
                                        .reduce((sum, f) => sum + f.total_cost, 0).toFixed(2)}
                                </h3>
                                <p className="text-white/60 text-xs mt-2">Verified completed prints</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
                                <p className="text-yellow-200 text-sm mb-1">Pending Costs</p>
                                <h3 className="text-4xl font-bold text-white">
                                    ₹{myFiles
                                        .filter(f => f.status !== 'downloaded')
                                        .reduce((sum, f) => sum + f.total_cost, 0).toFixed(2)}
                                </h3>
                                <p className="text-white/60 text-xs mt-2">Active queue/private prints</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-6">
                                <p className="text-blue-200 text-sm mb-1">Total Files</p>
                                <h3 className="text-4xl font-bold text-white">{myFiles.length}</h3>
                                <p className="text-white/60 text-xs mt-2">Lifetime uploads</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* File History View (replaces My Files section when view='history') */}
                {(view === 'history' || view === 'dashboard') && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-4xl">📁</div>
                            <h2 className="text-2xl font-bold text-white">
                                {view === 'history' ? 'File History' : 'My Files'}
                            </h2>
                            {view === 'history' && (
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="ml-auto px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                                >
                                    ← Back to Dashboard
                                </button>
                            )}
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

                                                {file.shop_name ? (
                                                    <div className="mt-2 text-sm flex items-center gap-2">
                                                        <div>
                                                            <span className="text-purple-300">Shop:</span>
                                                            <span className="text-white ml-1">{file.shop_name}</span>
                                                            {file.queue_position && (
                                                                <>
                                                                    <span className="text-purple-300 ml-3">Position:</span>
                                                                    <span className="text-pink-400 ml-1 font-bold">#{file.queue_position}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {file.shop_lat && file.shop_long && (
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&destination=${file.shop_lat},${file.shop_long}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-auto px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1 text-xs"
                                                            >
                                                                🧭 Navigate
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-sm flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                                            }}
                                                            className="ml-auto px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg hover:bg-pink-500/30 transition-colors flex items-center gap-1 text-xs"
                                                        >
                                                            📍 Find Nearby Shop
                                                        </button>
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
                )}

                {/* Map View */}
                {view === 'dashboard' && userLat !== null && userLong !== null && shops.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-4xl">🗺️</div>
                            <h2 className="text-2xl font-bold text-white">Nearby Shops Map</h2>
                        </div>
                        <MapComponent
                            userLat={userLat}
                            userLong={userLong}
                            shops={shops}
                        />
                        <p className="text-purple-200 text-sm mt-4 text-center">
                            📍 Blue pin = Your location | 🔴 Red pins = Print shops
                        </p>
                    </div>
                )}
            </div>

            {/* Favorite Shops View */}
            {view === 'favorites' && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-4xl">⭐</div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Favorite Shops</h2>
                            <p className="text-purple-200 text-sm">Your quick access list</p>
                        </div>
                        <button
                            onClick={() => setView('dashboard')}
                            className="ml-auto px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-purple-300">
                                <p className="text-xl mb-2">No favorite shops yet</p>
                                <p className="text-sm">Go to Dashboard and add shops to your favorites!</p>
                            </div>
                        ) : (
                            shops.filter(s => favorites.includes(s.id)).map(shop => (
                                <div key={shop.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{shop.username}</h3>
                                            <p className="text-purple-200 text-sm">{shop.distance?.toFixed(2)} km away</p>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(shop.id)}
                                            className="text-2xl hover:scale-110 transition-transform"
                                            title="Remove from favorites"
                                        >
                                            ⭐
                                        </button>
                                    </div>
                                    <p className="text-white/60 text-sm mb-4">{shop.address || 'No address provided'}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedShop(shop.id.toString());
                                                setPrintType('queue');
                                                setView('dashboard');
                                            }}
                                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg font-semibold transition-colors"
                                        >
                                            Select
                                        </button>
                                        {shop.lat && shop.long && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.long}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                                title="Navigate"
                                            >
                                                🧭
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

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
        </div >
    );
}
