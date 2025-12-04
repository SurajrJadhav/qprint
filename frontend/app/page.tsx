"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
                {/* Logo and Brand */}
                <div className={`text-center mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                    <div className="inline-block mb-6">
                        <div className="relative">
                            <h1 className="text-7xl md:text-8xl font-black text-white mb-2 tracking-tight">
                                Q<span className="text-pink-400">print</span>
                            </h1>
                            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full"></div>
                        </div>
                    </div>

                    <p className="text-2xl md:text-3xl text-white font-light mb-4">
                        Print Without Standing in Queue
                    </p>
                    <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto">
                        Upload your documents from anywhere, get a unique code, and collect your prints instantly from the nearest shop
                    </p>
                </div>

                {/* Feature Cards */}
                <div className={`grid md:grid-cols-3 gap-6 mb-12 max-w-5xl w-full transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">📤</div>
                        <h3 className="text-xl font-bold text-white mb-2">Upload Anywhere</h3>
                        <p className="text-purple-200">Upload your documents from home, office, or on the go</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">🔢</div>
                        <h3 className="text-xl font-bold text-white mb-2">Get Unique Code</h3>
                        <p className="text-purple-200">Receive a secure code to collect your prints</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">🖨️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Instant Print</h3>
                        <p className="text-purple-200">Walk in, show your code, and collect your prints</p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <Link
                        href="/register"
                        className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                    >
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>

                    <Link
                        href="/login"
                        className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-bold text-lg rounded-full border-2 border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Stats */}
                <div className={`mt-16 grid grid-cols-3 gap-8 max-w-3xl w-full transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">Fast</div>
                        <div className="text-purple-200 text-sm">No Waiting</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">Secure</div>
                        <div className="text-purple-200 text-sm">Unique Codes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">Easy</div>
                        <div className="text-purple-200 text-sm">3 Simple Steps</div>
                    </div>
                </div>
            </div>

            {/* Custom animations */}
            <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
}
