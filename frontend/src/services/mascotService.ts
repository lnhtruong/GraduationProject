import { API_BASE_URL } from "@/config";

const MASCOT_ENDPOINT = "/mascot";

/**
 * Add mascot to video
 * @param video - Video file (MP4, AVI, MOV, etc.)
 * @param mascot_image - Mascot image file (JPG, PNG, GIF)
 * @param position - Position of mascot
 * @param margin_x - Horizontal margin (pixels, default: 0)
 * @param margin_y - Vertical margin (pixels, default: 0)
 * @param scale - Scale factor (0.1 to 2.0, default: 0.5)
 */
export async function addMascotToVideo(
  video: File,
  mascot_image: File,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'replace',
  margin_x: number = 40,
  margin_y: number = 40,
  scale: number = 1,
  audio?: File
): Promise<{ job_id: string; status: string }> {
  const url = `${API_BASE_URL}${MASCOT_ENDPOINT}`;

  // Create FormData
  const formData = new FormData();
  formData.append('video', video);
  formData.append('mascot_image', mascot_image);
  formData.append('position', position);
  formData.append('margin_x', margin_x.toString());
  formData.append('margin_y', margin_y.toString());
  formData.append('scale', scale.toString());
  if (audio) {
    formData.append('audio', audio);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Mascot upload failed:', text);
      throw new Error(`Mascot upload failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log('Job created:', data);
    
    return data; // { job_id: "...", status: "pending" }
  } catch (err) {
    console.error('addMascotToVideo error:', err);
    throw new Error(`addMascotToVideo error: ${err}`);
  }
}

/**
 * Poll job status until completed
 */
export async function pollJobStatus(
  job_id: string,
  onProgress?: (stage: string) => void
): Promise<{ status: string; result?: any }> {
  const url = `${API_BASE_URL}/jobs/status/${job_id}`;
  
  console.log('Polling job status:', job_id);

  while (true) {
    try {
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Job status:', data);

      // Update progress callback
      if (onProgress && data.stage) {
        onProgress(data.stage);
      }

      // Check if completed
      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Job failed');
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error('Poll error:', err);
      throw err;
    }
  }
}

/**
 * Download processed video
 */
export async function downloadMascotVideo(job_id: string): Promise<string> {
  const url = `${API_BASE_URL}/download/${job_id}`;
  
  console.log('Downloading video:', job_id);

  try {
    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('Video downloaded:', blobUrl);
    return blobUrl;
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
}

/**
 * Main function: Upload → Poll → Download
 */
export async function addMascotAndDownload(
  video: File,
  mascot_image: File,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'replace',
  margin_x: number = 40,
  margin_y: number = 40,
  scale: number = 1,
  audio?: File,
  onProgress?: (stage: string) => void
): Promise<string> {
  console.log('Starting mascot processing...');

  // Step 1: Upload và tạo job
  const { job_id } = await addMascotToVideo(
    video,
    mascot_image,
    position,
    margin_x,
    margin_y,
    scale,
    audio
  );

  console.log('Job ID:', job_id);

  // Step 2: Poll job status
  await pollJobStatus(job_id, onProgress);

  // Step 3: Download kết quả
  const blobUrl = await downloadMascotVideo(job_id);

  console.log('Mascot processing completed!');
  return blobUrl;
}

/**
 * Calculate max margins based on video dimensions and mascot scale
 */
export async function calculateMaxMargins(
  videoFile: File,
  mascot_image: File,
  scale: number
): Promise<{ maxMarginX: number; maxMarginY: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const img = new Image();
    
    let videoLoaded = false;
    let imageLoaded = false;
    
    const checkBothLoaded = () => {
      if (videoLoaded && imageLoaded) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const mascotWidth = img.width * scale;
        const mascotHeight = img.height * scale;
        
        const maxMarginX = Math.max(0, videoWidth - mascotWidth);
        const maxMarginY = Math.max(0, videoHeight - mascotHeight);
        
        resolve({ maxMarginX, maxMarginY });
        
        // Cleanup
        URL.revokeObjectURL(video.src);
        URL.revokeObjectURL(img.src);
      }
    };
    
    video.onloadedmetadata = () => {
      videoLoaded = true;
      checkBothLoaded();
    };
    
    img.onload = () => {
      imageLoaded = true;
      checkBothLoaded();
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    img.onerror = () => reject(new Error('Failed to load image'));
    
    video.src = URL.createObjectURL(videoFile);
    img.src = URL.createObjectURL(mascot_image);
  });
}

/**
 * Validate mascot parameters
 */
export function validateMascotParams(
  position: string,
  margin_x: number,
  margin_y: number,
  scale: number,
  maxMarginX?: number,
  maxMarginY?: number
): { valid: boolean; error?: string } {
  const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'replace'];
  
  if (!validPositions.includes(position)) {
    return { 
      valid: false, 
      error: `Position không hợp lệ. Phải là một trong: ${validPositions.join(', ')}` 
    };
  }

  if (margin_x < 0 || margin_y < 0) {
    return { 
      valid: false, 
      error: 'Lề không được âm' 
    };
  }

  if (scale < 0.1 || scale > 2.0) {
    return { 
      valid: false, 
      error: 'Kích thước phải từ 0.1 đến 2.0' 
    };
  }
  
  // Check if margins exceed video bounds
  if (position !== 'replace') {
    if (maxMarginX !== undefined && margin_x > maxMarginX) {
      return {
        valid: false,
        error: `Lề ngang vượt quá giới hạn (tối đa: ${Math.round(maxMarginX)}px)`
      };
    }
    
    if (maxMarginY !== undefined && margin_y > maxMarginY) {
      return {
        valid: false,
        error: `Lề dọc vượt quá giới hạn (tối đa: ${Math.round(maxMarginY)}px)`
      };
    }
  }

  return { valid: true };
}

/**
 * Get default mascot parameters
 */
export function getDefaultMascotParams() {
  return {
    position: 'bottom-right' as const,
    margin_x: 40,
    margin_y: 40,
    scale: 1,
  };
}

export const mascotService = {
  addMascotToVideo,
  addMascotAndDownload,
  pollJobStatus,
  downloadMascotVideo,
  calculateMaxMargins,
  validateMascotParams,
  getDefaultMascotParams,
};