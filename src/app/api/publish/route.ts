import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File Paths
const CONTENT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'src', 'content');
const CONFIG_FILE = path.join(CONTENT_DIR, 'published-config.json');

const PUBLIC_PHOTOS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'photos');
const PUBLIC_VIDEOS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'videos');
const PUBLIC_MUSIC_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'music');

// Helper: Ensure directory exists
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper: Write Base64 string to a file
const writeBase64File = (dataUrl: string, destDir: string, baseName: string): string => {
  ensureDir(destDir);
  
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  let ext = mimeType.split('/')[1] || 'bin';
  
  // Clean up extensions
  if (ext === 'quicktime') ext = 'mov';
  if (ext === 'mpeg') ext = 'mp3';
  if (ext === 'x-wav') ext = 'wav';
  if (ext === 'x-m4a' || ext === 'mp4') ext = 'm4a';

  const fileName = `${baseName}.${ext}`;
  const filePath = path.join(destDir, fileName);
  const buffer = Buffer.from(parts[1], 'base64');
  
  fs.writeFileSync(filePath, buffer);
  return fileName;
};

// Helper: Clean files in directory written by publish (prefixed files or clean whole folder)
const cleanDirOfUploadedFiles = (dirPath: string, prefix = 'photo_') => {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.startsWith(prefix)) {
      try {
        fs.unlinkSync(path.join(dirPath, file));
      } catch (e) {
        console.error(`Failed to clean file ${file}`, e);
      }
    }
  }
};

// ---------------- GET: READ SHARED PUBLISHED CONFIG ----------------

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return NextResponse.json({ success: false, message: 'No published configuration' });
    }

    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return NextResponse.json({ success: true, ...config });
  } catch (error) {
    console.error('Error reading published config:', error);
    return NextResponse.json({ success: false, error: 'Failed to read published config' }, { status: 500 });
  }
}

// ---------------- POST: WRITE DATA & MEDIA FILES TO SERVER ----------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { textConfig, photos, video, music } = body;

    ensureDir(CONTENT_DIR);

    // 1. Process Photos
    // Clean old uploaded photos first to avoid disk bloating
    cleanDirOfUploadedFiles(PUBLIC_PHOTOS_DIR, 'photo_');
    
    const savedPhotos = [];
    if (photos && Array.isArray(photos)) {
      for (const p of photos) {
        if (p.data && p.data.startsWith('data:')) {
          const fileName = writeBase64File(p.data, PUBLIC_PHOTOS_DIR, `photo_${p.id}`);
          savedPhotos.push({
            id: p.id,
            name: p.name,
            path: `/photos/${fileName}`,
            order: p.order,
          });
        }
      }
    }

    // 2. Process Video
    let savedVideo = null;
    if (video && video.data && video.data.startsWith('data:')) {
      // Clean previous wishes films
      cleanDirOfUploadedFiles(PUBLIC_VIDEOS_DIR, 'birthday-film');
      const fileName = writeBase64File(video.data, PUBLIC_VIDEOS_DIR, 'birthday-film');
      savedVideo = {
        name: video.name,
        path: `/videos/${fileName}`,
      };
    }

    // 3. Process Music
    let savedMusic = null;
    if (music && music.data && music.data.startsWith('data:')) {
      // Clean previous themes
      cleanDirOfUploadedFiles(PUBLIC_MUSIC_DIR, 'theme');
      const fileName = writeBase64File(music.data, PUBLIC_MUSIC_DIR, 'theme');
      savedMusic = {
        name: music.name,
        path: `/music/${fileName}`,
      };
    }

    // 4. Save metadata JSON
    const lastUpdated = new Date().toISOString();
    const publishedPayload = {
      textConfig,
      photos: savedPhotos,
      video: savedVideo,
      music: savedMusic,
      lastUpdated,
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(publishedPayload, null, 2), 'utf-8');

    return NextResponse.json({ success: true, lastUpdated });
  } catch (error) {
    console.error('Error publishing configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to publish configuration' }, { status: 500 });
  }
}
