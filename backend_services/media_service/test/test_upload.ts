import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

async function run(): Promise<void> {
    const cloudinaryService = new CloudinaryService();

    try {
        // const url = 'https://www.w3schools.com/html/mov_bbb.mp4';
        const localPath = './test/mascot_test_voice.mp4';

        // 1. Download
        // await cloudinaryService.downloadVideoFromUrl(url, localPath);

        // 2. Upload
        const cloudUrl = await cloudinaryService.uploadToCloudinary(localPath);

        console.log('🌍 Uploaded URL:', cloudUrl);
    } catch (err: any) {
        console.error(err);
    }
}

run();