import { API_BASE_URL } from "@/config";
import { apiClient } from "./apiClient";

const MASCOT_ENDPOINT = "/mascot";

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[MascotService] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[MascotService ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[MascotService WARNING] ${message}`, data || '');
  }
};

/**
 * Add mascot to video
 * @param video - Video file (MP4, AVI, MOV, etc.)
 * @param mascot_image - Mascot image file (JPG, PNG, GIF)
 * @param position - Position of mascot
 * @param margin_x - Horizontal margin (pixels, default: 0)
 * @param margin_y - Vertical margin (pixels, default: 0)
 * @param scale - Scale factor (0.1 to 2.0, default: 0.5)
 * @param audio - Optional audio file for mascot
 * @returns Job ID and initial status
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
  
  log.info('Starting mascot upload', {
    videoName: video.name,
    videoSize: video.size,
    mascotName: mascot_image.name,
    mascotSize: mascot_image.size,
    position,
    margin_x,
    margin_y,
    scale,
    hasAudio: !!audio
  });

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
    log.info('Audio file attached', { audioName: audio.name, audioSize: audio.size });
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

    log.info('Upload response received', { 
      status: response.status, 
      statusText: response.statusText 
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      log.error('Mascot upload failed', { 
        status: response.status, 
        statusText: response.statusText,
        responseBody: text 
      });
      throw new Error(`Mascot upload failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    log.info('Job created successfully', data);
    
    return data; // { job_id: "...", status: "pending" }
  } catch (err) {
    log.error('addMascotToVideo error', err);
    throw new Error(`addMascotToVideo error: ${err}`);
  }
}

/**
 * Poll job status until completed
 * Uses apiClient for consistency with other services
 */
export async function pollJobStatus(
  job_id: string,
  onProgress?: (stage: string) => void,
  maxRetries: number = 3
): Promise<{ status: string; result?: any }> {
  const endpoint = `/jobs/status/${job_id}`;
  let pollCount = 0;
  let consecutiveErrors = 0;
  
  log.info('Starting job status polling', { job_id, maxRetries });

  while (true) {
    pollCount++;
    
    try {
      log.info(`Polling attempt #${pollCount}`, { job_id });
      
      // Use apiClient for consistency
      const data = await apiClient.get<any>(endpoint);
      
      consecutiveErrors = 0; // Reset error counter on success
      
      log.info('Job status received', { 
        pollCount, 
        status: data.status, 
        stage: data.stage,
        progress: data.progress,
        fullData: data
      });

      // Update progress callback
      if (onProgress && data.stage) {
        onProgress(data.stage);
        log.info('Progress callback fired', { stage: data.stage });
      }

      // Check if completed
      if (data.status === 'completed') {
        log.info('Job completed successfully', { job_id, result: data.result });
        return data;
      }

      if (data.status === 'failed') {
        const errorMsg = data.error || 'Job failed';
        log.error('Job failed', { job_id, error: errorMsg, fullData: data });
        throw new Error(errorMsg);
      }

      // Wait 2 seconds before next poll
      log.info('Waiting 2 seconds before next poll...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err: any) {
      consecutiveErrors++;
      
      log.error(`Poll error (attempt ${consecutiveErrors}/${maxRetries})`, {
        job_id,
        error: err.message || err,
        stack: err.stack
      });

      // If we've hit max retries, throw the error
      if (consecutiveErrors >= maxRetries) {
        log.error('Max retries reached, giving up', { job_id, consecutiveErrors });
        throw new Error(`Failed to get job status after ${maxRetries} retries: ${err.message || err}`);
      }

      // Wait longer on error before retrying (exponential backoff)
      const backoffTime = 2000 * Math.pow(2, consecutiveErrors - 1);
      log.warn(`Retrying after ${backoffTime}ms...`, { consecutiveErrors });
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}

/**
 * Download processed video
 * Uses direct fetch to handle binary data
 */
export async function downloadMascotVideo(job_id: string): Promise<string> {
  const url = `${API_BASE_URL}/download/${job_id}`;
  
  log.info('Starting video download', { job_id, url });

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    log.info('Download response received', { 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      log.error('Download failed', { status: response.status, responseBody: text });
      throw new Error(`Download failed: ${response.status} ${text}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    log.info('Video downloaded successfully', { 
      job_id, 
      blobSize: blob.size,
      blobType: blob.type,
      blobUrl 
    });
    
    return blobUrl;
  } catch (err) {
    log.error('Download error', err);
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
  log.info('=== Starting mascot processing workflow ===');

  try {
    // Step 1: Upload và tạo job
    log.info('Step 1: Uploading files and creating job...');
    const { job_id } = await addMascotToVideo(
      video,
      mascot_image,
      position,
      margin_x,
      margin_y,
      scale,
      audio
    );

    log.info('Step 1 completed', { job_id });

    // Step 2: Poll job status
    log.info('Step 2: Polling job status...');
    const result = await pollJobStatus(job_id, onProgress);
    log.info('Step 2 completed', { result });

    // Step 3: Download kết quả
    log.info('Step 3: Downloading result...');
    const blobUrl = await downloadMascotVideo(job_id);
    log.info('Step 3 completed', { blobUrl });

    log.info('=== Mascot processing completed successfully! ===');
    return blobUrl;
    
  } catch (err) {
    log.error('=== Mascot processing failed ===', err);
    throw err;
  }
}

/**
 * Calculate max margins based on video dimensions and mascot scale
 */
export async function calculateMaxMargins(
  videoFile: File,
  mascot_image: File,
  scale: number
): Promise<{ maxMarginX: number; maxMarginY: number }> {
  log.info('Calculating max margins', { 
    videoName: videoFile.name, 
    mascotName: mascot_image.name, 
    scale 
  });
  
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
        
        log.info('Max margins calculated', {
          videoWidth,
          videoHeight,
          mascotWidth,
          mascotHeight,
          maxMarginX,
          maxMarginY
        });
        
        resolve({ maxMarginX, maxMarginY });
        
        // Cleanup
        URL.revokeObjectURL(video.src);
        URL.revokeObjectURL(img.src);
      }
    };
    
    video.onloadedmetadata = () => {
      log.info('Video metadata loaded', { 
        width: video.videoWidth, 
        height: video.videoHeight 
      });
      videoLoaded = true;
      checkBothLoaded();
    };
    
    img.onload = () => {
      log.info('Mascot image loaded', { 
        width: img.width, 
        height: img.height 
      });
      imageLoaded = true;
      checkBothLoaded();
    };
    
    video.onerror = (e) => {
      log.error('Failed to load video', e);
      reject(new Error('Failed to load video'));
    };
    
    img.onerror = (e) => {
      log.error('Failed to load image', e);
      reject(new Error('Failed to load image'));
    };
    
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
  log.info('Validating mascot params', { 
    position, 
    margin_x, 
    margin_y, 
    scale, 
    maxMarginX, 
    maxMarginY 
  });
  
  const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'replace'];
  
  if (!validPositions.includes(position)) {
    const error = `Position không hợp lệ. Phải là một trong: ${validPositions.join(', ')}`;
    log.warn('Invalid position', { position, error });
    return { valid: false, error };
  }

  if (margin_x < 0 || margin_y < 0) {
    const error = 'Lề không được âm';
    log.warn('Negative margins', { margin_x, margin_y, error });
    return { valid: false, error };
  }

  if (scale < 0.1 || scale > 2.0) {
    const error = 'Kích thước phải từ 0.1 đến 2.0';
    log.warn('Invalid scale', { scale, error });
    return { valid: false, error };
  }
  
  // Check if margins exceed video bounds
  if (position !== 'replace') {
    if (maxMarginX !== undefined && margin_x > maxMarginX) {
      const error = `Lề ngang vượt quá giới hạn (tối đa: ${Math.round(maxMarginX)}px)`;
      log.warn('Margin X exceeds limit', { margin_x, maxMarginX, error });
      return { valid: false, error };
    }
    
    if (maxMarginY !== undefined && margin_y > maxMarginY) {
      const error = `Lề dọc vượt quá giới hạn (tối đa: ${Math.round(maxMarginY)}px)`;
      log.warn('Margin Y exceeds limit', { margin_y, maxMarginY, error });
      return { valid: false, error };
    }
  }

  log.info('Validation passed');
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