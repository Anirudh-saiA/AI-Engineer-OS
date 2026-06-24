"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

interface ProfileTabProps {
  user: any;
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone_number: "",
    email: "",
    country: "",
    city: "",
    postal_code: ""
  });

  const [saving, setSaving] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          date_of_birth: data.date_of_birth || "",
          phone_number: data.phone_number || "",
          email: data.email || "",
          country: data.country || "",
          city: data.city || "",
          postal_code: data.postal_code || ""
        });
      }
    } catch (err) {
      console.error("Failed to load developer profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleSave = async (section: "personal" | "address") => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.uid}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        if (section === "personal") setIsEditingPersonal(false);
        if (section === "address") setIsEditingAddress(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-scale-in">
        <div className="w-12 h-12 border-4 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-400 tracking-wider">Retrieving Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center shadow-md max-w-lg mx-auto mt-10 animate-fade-up">
        <span className="text-5xl mb-4 block">🤖</span>
        <h3 className="text-xl font-black">Profile Uncalibrated</h3>
        <p className="text-xs text-slate-400 leading-relaxed mt-2">
          Your profile could not be loaded.
        </p>
      </div>
    );
  }

  // Calculate Completion Percentage
  const fieldsToCheck = [
    formData.first_name,
    formData.last_name,
    formData.date_of_birth,
    formData.phone_number,
    formData.email,
    formData.country,
    formData.city,
    formData.postal_code
  ];
  
  const filledFields = fieldsToCheck.filter(f => f && f.trim().length > 0).length;
  const totalFields = fieldsToCheck.length;
  const completionPercent = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-6 animate-fade-up max-w-6xl mx-auto">
      
      {/* HEADER SECTION: Profile Completion + User Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm border border-[var(--border)] bg-[var(--bg-card)]">
        
        {/* Profile Avatar */}
        <div className="w-24 h-24 rounded-full border-2 p-1 border-gray-200 bg-white flex-shrink-0 overflow-hidden relative">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500 uppercase">
              {profile.first_name?.[0] || profile.full_name?.[0] || "U"}
            </div>
          )}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center text-white text-[10px]">
            📷
          </div>
        </div>

        {/* Bio Details */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
          <h3 className="text-xl font-bold text-teal-900 tracking-tight">
            {profile.first_name || profile.last_name 
              ? `${profile.first_name} ${profile.last_name}`.trim() 
              : profile.full_name || "New User"}
          </h3>
          <p className="text-sm text-slate-500">Admin</p>
          <p className="text-sm text-slate-500 mt-1">
            {profile.city && profile.country 
              ? `${profile.city}, ${profile.country}` 
              : profile.country || profile.city || "Location not set"}
          </p>
        </div>

        {/* Profile Completion Pie Chart */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Pie Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                className="text-gray-200"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Foreground circle */}
              <path
                className="text-orange-500 drop-shadow-md"
                strokeDasharray={`${completionPercent}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-teal-900">{completionPercent}%</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Complete</span>
        </div>
      </div>

      {/* PERSONAL INFORMATION */}
      <div className="glass-card rounded-3xl p-8 relative shadow-sm border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-teal-900">Personal Information</h4>
          {!isEditingPersonal ? (
            <button 
              onClick={() => setIsEditingPersonal(true)}
              className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              Edit ✎
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setIsEditingPersonal(false);
                  setFormData(prev => ({...prev, first_name: profile.first_name || "", last_name: profile.last_name || "", date_of_birth: profile.date_of_birth || "", phone_number: profile.phone_number || "", email: profile.email || ""}));
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave("personal")}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
          {/* First Name */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">First Name</p>
            {!isEditingPersonal ? (
              <p className="font-semibold text-teal-900">{profile.first_name || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Last Name</p>
            {!isEditingPersonal ? (
              <p className="font-semibold text-teal-900">{profile.last_name || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Date of Birth</p>
            {!isEditingPersonal ? (
              <p className="font-semibold text-teal-900">{profile.date_of_birth || "—"}</p>
            ) : (
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-400">Email Address</p>
              {user?.emailVerified ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Verified</span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Unverified</span>
              )}
            </div>
            {!isEditingPersonal ? (
              <p className="font-semibold text-teal-900">{profile.email || "—"}</p>
            ) : (
              <input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Phone Number</p>
            {!isEditingPersonal ? (
              <p className="font-semibold text-teal-900">{profile.phone_number || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* User Role */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">User Role</p>
            <p className="font-semibold text-teal-900">Admin</p>
          </div>
        </div>
      </div>

      {/* ADDRESS SECTION */}
      <div className="glass-card rounded-3xl p-8 relative shadow-sm border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-teal-900">Address</h4>
          {!isEditingAddress ? (
            <button 
              onClick={() => setIsEditingAddress(true)}
              className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              Edit ✎
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setIsEditingAddress(false);
                  setFormData(prev => ({...prev, country: profile.country || "", city: profile.city || "", postal_code: profile.postal_code || ""}));
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave("address")}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
          {/* Country */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Country</p>
            {!isEditingAddress ? (
              <p className="font-semibold text-teal-900">{profile.country || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* City */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">City</p>
            {!isEditingAddress ? (
              <p className="font-semibold text-teal-900">{profile.city || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Postal Code</p>
            {!isEditingAddress ? (
              <p className="font-semibold text-teal-900">{profile.postal_code || "—"}</p>
            ) : (
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-teal-900"
              />
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
