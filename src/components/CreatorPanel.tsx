'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, ArrowUp, ArrowDown, Download, RotateCcw, Save, Settings, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';
import { PhotoEntry, MediaEntry, TextConfig, savePhoto, deletePhoto, saveVideo, deleteVideo, saveMusic, deleteMusic, saveTextConfig, resetDB } from '@/utils/db';

interface CreatorPanelProps {
  textConfig: TextConfig;
  photos: PhotoEntry[];
  video: MediaEntry | null;
  music: MediaEntry | null;
  onRefreshData: () => void;
  onClose: () => void;
  onTextChange: (newConfig: TextConfig) => void;
}

export default function CreatorPanel({
  textConfig,
  photos,
  video,
  music,
  onRefreshData,
  onClose,
  onTextChange,
}: CreatorPanelProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'video' | 'music' | 'text' | 'system'>('photos');
  const [isUploading, setIsUploading] = useState(false);
  const [logMessage, setLogMessage] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Helper: show log updates briefly
  const triggerLog = (msg: string) => {
    setLogMessage(msg);
    setTimeout(() => setLogMessage(''), 4000);
  };

  // Helper: convert Blob to base64 for JSON serialization
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper: convert Base64 back to Blob
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const mimeType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: mimeType });
  };

  // ---------------- PHOTO STORAGE HANDLERS ----------------

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsUploading(true);
    triggerLog('Processing photos...');

    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (acceptedTypes.includes(file.type)) {
        const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        const order = photos.length + count + 1;
        await savePhoto(id, file.name, file, order);
        count++;
      }
    }

    setIsUploading(false);
    triggerLog(`Uploaded ${count} photos successfully.`);
    onRefreshData();
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhoto(id);
    triggerLog('Photo removed.');
    onRefreshData();
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    const current = photos[index];
    const target = photos[targetIdx];

    // Swap order values in IndexedDB
    await savePhoto(current.id, current.name, current.blob, target.order);
    await savePhoto(target.id, target.name, target.blob, current.order);

    onRefreshData();
  };

  // ---------------- VIDEO STORAGE HANDLERS ----------------

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'video/mp4' && !file.name.endsWith('.mov')) {
      alert('Only MP4 and MOV videos are accepted.');
      return;
    }

    setIsUploading(true);
    triggerLog('Uploading wishes film...');
    await saveVideo(file, file.name);
    setIsUploading(false);
    triggerLog('Video film updated.');
    onRefreshData();
  };

  const handleDeleteVideo = async () => {
    if (confirm('Delete wishes video?')) {
      await deleteVideo();
      triggerLog('Video removed.');
      onRefreshData();
    }
  };

  // ---------------- MUSIC STORAGE HANDLERS ----------------

  const handleMusicFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const acceptedExtensions = ['.mp3', '.mpeg', '.mpga', '.wav', '.m4a', '.aac', '.ogg'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!acceptedExtensions.includes(fileExtension) && !file.type.startsWith('audio/')) {
      alert('Accepted audio formats: MP3, MPEG, MPGA, WAV, M4A, AAC, OGG');
      return;
    }

    setIsUploading(true);
    triggerLog('Uploading theme soundtrack...');
    await saveMusic(file, file.name);
    setIsUploading(false);
    triggerLog('Theme song updated.');
    onRefreshData();
  };

  const handleDeleteMusic = async () => {
    if (confirm('Remove custom theme song?')) {
      await deleteMusic();
      triggerLog('Music track removed.');
      onRefreshData();
    }
  };

  // ---------------- TEXT HANDLERS ----------------

  const handleTextConfigInput = (key: string, value: string, subKey?: string, isParagraph = false, pIndex = 0) => {
    const newConfig = { ...textConfig };
    
    if (subKey) {
      (newConfig as any)[key][subKey] = value;
    } else if (isParagraph) {
      newConfig.heroParagraphs[pIndex] = value;
    } else {
      (newConfig as any)[key] = value;
    }

    onTextChange(newConfig);
  };

  // ---------------- BACKUP EXPORT & IMPORT ----------------

  const handleExportBackup = async () => {
    triggerLog('Packaging backup JSON...');
    try {
      const photoBackups = [];
      for (const p of photos) {
        const base64 = await blobToBase64(p.blob);
        photoBackups.push({ id: p.id, name: p.name, data: base64, order: p.order });
      }

      let videoBase64 = '';
      if (video) {
        videoBase64 = await blobToBase64(video.blob);
      }

      let musicBase64 = '';
      if (music) {
        musicBase64 = await blobToBase64(music.blob);
      }

      const backupObject = {
        textConfig,
        photos: photoBackups,
        video: video ? { name: video.name, data: videoBase64 } : null,
        music: music ? { name: music.name, data: musicBase64 } : null,
      };

      const jsonStr = JSON.stringify(backupObject);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'memory-box-universe.json';
      link.click();
      
      triggerLog('Backup file downloaded.');
    } catch (e) {
      alert('Failed to package backup JSON.');
      console.error(e);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerLog('Importing backup package...');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = JSON.parse(event.target?.result as string);
        
        // Reset DB first
        await resetDB();

        // 1. Text
        if (data.textConfig) {
          await saveTextConfig(data.textConfig);
        }

        // 2. Photos
        if (data.photos && Array.isArray(data.photos)) {
          for (const p of data.photos) {
            const blob = base64ToBlob(p.data);
            await savePhoto(p.id, p.name, blob, p.order);
          }
        }

        // 3. Video
        if (data.video) {
          const blob = base64ToBlob(data.video.data);
          await saveVideo(blob, data.video.name);
        }

        // 4. Music
        if (data.music) {
          const blob = base64ToBlob(data.music.data);
          await saveMusic(blob, data.music.name);
        }

        triggerLog('Import completed! Refreshing universe...');
        onRefreshData();
      };
      reader.readAsText(file);
    } catch (e) {
      alert('Failed to parse backup file.');
      console.error(e);
    }
  };

  const handleResetSystem = async () => {
    if (confirm('DANGER: Reset website configuration to initial defaults? All text inputs and uploaded media will be deleted.')) {
      await resetDB();
      triggerLog('Defaults restored.');
      onRefreshData();
    }
  };

  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed left-0 top-0 bottom-0 w-full md:w-[420px] bg-[#17111D]/95 border-r border-sakura/50 z-50 flex flex-col p-6 shadow-2xl overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-sakura/30 pb-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-dream-pink font-bold">Creator Dashboard</span>
          <h3 className="serif-heading text-xl text-dusty-plum font-semibold">Universe Builder</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-sakura/25 hover:bg-sakura/40 text-dusty-plum border border-sakura/30 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-5 gap-1 mb-6 bg-cloud-pink/20 p-1 rounded-xl border border-sakura/25">
        {[
          { id: 'photos', label: 'Photos', icon: ImageIcon },
          { id: 'video', label: 'Video', icon: Film },
          { id: 'music', label: 'Music', icon: Music },
          { id: 'text', label: 'Text', icon: FileText },
          { id: 'system', label: 'System', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
                isActive ? 'bg-sakura text-dream-pink' : 'text-dusty-plum/50 hover:text-dusty-plum'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[7.5px] uppercase tracking-wider font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Log */}
      {logMessage && (
        <div className="text-[9px] uppercase tracking-widest text-dream-pink bg-sakura/10 border border-sakura/30 px-3 py-2 rounded-xl text-center mb-6 animate-pulse select-none">
          {logMessage}
        </div>
      )}

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 text-sm">
        
        {/* PANEL: PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <h4 className="font-serif italic text-dream-pink text-base font-medium">Memory Images</h4>
            
            {/* Drag & Drop zone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handlePhotoFiles(e.dataTransfer.files);
              }}
              onClick={() => photoInputRef.current?.click()}
              className="border-2 border-dashed border-sakura/35 rounded-2xl p-6 text-center hover:bg-sakura/5 hover:border-dream-pink/50 transition-all cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-sakura group-hover:scale-105 transition-transform mx-auto mb-3" />
              <span className="text-xs font-semibold text-dusty-plum/85 block mb-1">Click or drag files here</span>
              <span className="text-[9px] text-dusty-plum/45 uppercase tracking-wider block">JPG, JPEG, PNG, WEBP (Multiple allowed)</span>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handlePhotoFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {/* List with drag-order indicators */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {photos.length > 0 ? (
                photos.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-cloud-pink/15 border border-sakura/20 text-xs gap-3">
                    <span className="w-5 h-5 bg-sakura/20 rounded-full flex items-center justify-center text-[9px] font-bold text-dream-pink select-none shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate flex-1 text-dusty-plum/70 font-mono text-[10px]">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMovePhoto(idx, 'up')}
                        className="p-1 rounded hover:bg-sakura/30 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === photos.length - 1}
                        onClick={() => handleMovePhoto(idx, 'down')}
                        className="p-1 rounded hover:bg-sakura/30 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(item.id)}
                        className="p-1 rounded text-red-400 hover:bg-red-400/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-dusty-plum/45 font-light">
                  No images uploaded yet. Stars in the constellation and polaroids are using frame placeholders.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL: VIDEO */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <h4 className="font-serif italic text-dream-pink text-base font-medium">Birthday Film wishes video</h4>
            
            <div className="border border-sakura/30 rounded-2xl p-6 bg-cloud-pink/10 flex flex-col items-center gap-4 text-center">
              <Film className="w-10 h-10 text-sakura animate-pulse" />
              {video ? (
                <div className="space-y-1 w-full">
                  <span className="text-xs font-bold text-dusty-plum block truncate px-2">{video.name}</span>
                  <span className="text-[9px] text-dream-pink uppercase font-semibold">Active wishes video</span>
                </div>
              ) : (
                <span className="text-xs text-dusty-plum/50 font-light block">Using fallback demo wishes file</span>
              )}

              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-2.5 bg-sakura hover:bg-sakura/80 text-dream-pink text-xs uppercase tracking-widest font-bold rounded-xl border border-sakura/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Video</span>
              </button>

              {video && (
                <button
                  onClick={handleDeleteVideo}
                  className="w-full py-2.5 border border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs uppercase tracking-widest font-bold rounded-xl cursor-pointer"
                >
                  Delete Video
                </button>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoFile}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* PANEL: MUSIC */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            <h4 className="font-serif italic text-dream-pink text-base font-medium">Soundtrack song</h4>
            
            <div className="border border-sakura/30 rounded-2xl p-6 bg-cloud-pink/10 flex flex-col items-center gap-4 text-center">
              <Music className="w-10 h-10 text-sakura" />
              {music ? (
                <div className="space-y-1 w-full">
                  <span className="text-xs font-bold text-dusty-plum block truncate px-2">{music.name}</span>
                  <span className="text-[9px] text-dream-pink uppercase font-semibold">Custom active track</span>
                </div>
              ) : (
                <span className="text-xs text-dusty-plum/50 font-light block">Using synthesiser Pad fallback loop</span>
              )}

              <button
                onClick={() => musicInputRef.current?.click()}
                className="w-full py-2.5 bg-sakura hover:bg-sakura/80 text-dream-pink text-xs uppercase tracking-widest font-bold rounded-xl border border-sakura/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Audio</span>
              </button>

              {music && (
                <button
                  onClick={handleDeleteMusic}
                  className="w-full py-2.5 border border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs uppercase tracking-widest font-bold rounded-xl cursor-pointer"
                >
                  Delete Track
                </button>
              )}

              <input
                ref={musicInputRef}
                type="file"
                accept="audio/mp3,audio/mpeg,audio/mpga,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/ogg"
                onChange={handleMusicFile}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* PANEL: TEXT CONFIG */}
        {activeTab === 'text' && (
          <div className="space-y-5 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
            <h4 className="font-serif italic text-dream-pink text-base font-medium">Text Parameters</h4>
            
            <div className="space-y-3.5">
              {/* Site Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-dusty-plum/50 tracking-wider">Site Brand Name</label>
                <input
                  type="text"
                  value={textConfig.title}
                  onChange={(e) => handleTextConfigInput('title', e.target.value)}
                  className="w-full p-2 rounded-xl bg-cloud-pink/15 border border-sakura/40 text-xs text-dusty-plum focus:border-dream-pink focus:outline-none"
                />
              </div>

              {/* Enter Button */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-dusty-plum/50 tracking-wider">Gate Button Label</label>
                <input
                  type="text"
                  value={textConfig.enterButton}
                  onChange={(e) => handleTextConfigInput('enterButton', e.target.value)}
                  className="w-full p-2 rounded-xl bg-cloud-pink/15 border border-sakura/40 text-xs text-dusty-plum focus:border-dream-pink focus:outline-none"
                />
              </div>

              {/* Hero Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-dusty-plum/50 tracking-wider">Hero Greeting Header</label>
                <input
                  type="text"
                  value={textConfig.heroTitle}
                  onChange={(e) => handleTextConfigInput('heroTitle', e.target.value)}
                  className="w-full p-2 rounded-xl bg-cloud-pink/15 border border-sakura/40 text-xs text-dusty-plum focus:border-dream-pink focus:outline-none"
                />
              </div>

              {/* Hero Subtitle */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-dusty-plum/50 tracking-wider">Hero Subtitle</label>
                <input
                  type="text"
                  value={textConfig.heroSubtitle}
                  onChange={(e) => handleTextConfigInput('heroSubtitle', e.target.value)}
                  className="w-full p-2 rounded-xl bg-cloud-pink/15 border border-sakura/40 text-xs text-dusty-plum focus:border-dream-pink focus:outline-none"
                />
              </div>

              {/* Hero Paragraphs */}
              {textConfig.heroParagraphs.map((para, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-dusty-plum/50 tracking-wider">Hero Body Log {idx + 1}</label>
                  <textarea
                    value={para}
                    rows={3}
                    onChange={(e) => handleTextConfigInput('heroParagraphs', e.target.value, undefined, true, idx)}
                    className="w-full p-2 rounded-xl bg-cloud-pink/15 border border-sakura/40 text-xs text-dusty-plum focus:border-dream-pink focus:outline-none resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL: SYSTEM INTEGRITY (EXPORT/IMPORT/RESET) */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h4 className="font-serif italic text-dream-pink text-base font-medium">Backup & Maintenance</h4>
            
            <div className="space-y-4">
              {/* Export Button */}
              <button
                onClick={handleExportBackup}
                className="w-full py-3 bg-sakura hover:bg-sakura/80 text-dream-pink text-xs uppercase tracking-widest font-bold rounded-2xl border border-sakura/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Universe JSON</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => importInputRef.current?.click()}
                className="w-full py-3 bg-cloud-pink/10 hover:bg-cloud-pink/20 text-dusty-plum text-xs uppercase tracking-widest font-bold rounded-2xl border border-sakura/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-sakura" style={{ color: '#FFB6D5' }} />
                <span>Import Universe JSON</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />

              <div className="h-[1px] bg-sakura/20 my-4" />

              {/* Reset Default Button */}
              <button
                onClick={handleResetSystem}
                className="w-full py-3 border border-red-400/40 text-red-400 hover:bg-red-400/10 text-xs uppercase tracking-widest font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Default Website</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
