﻿'use client';
import React from 'react';
export default function Footer() {
    return (
        <footer className="w-full py-6 bg-black text-white mt-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center">
                    <p>{new Date().getFullYear()} PulseCheck. All rights reserved.</p>
                    <div className="space-x-6">
                        <a href="#" className="hover:text-gray-400">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-400">Terms of Service</a>
                        <a href="#" className="hover:text-gray-400">Contact Us</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
