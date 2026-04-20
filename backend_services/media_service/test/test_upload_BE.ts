import fs from "node:fs";
import path from "node:path";
import * as tus from "tus-js-client";

// ====== PASTE từ response /bunny/videos/init-upload ======
const session = {
    upload: {
        endpoint: "https://video.bunnycdn.com/tusupload",
        libraryId: "639018",
        authorizationSignature: "99512fd1758e1038ffb12a6ab659cf2addf7f78a1de445119f52e6b8b79b4ed9",
        authorizationExpire: "1776488183",
        videoId: "477235dc-f964-4d6b-8d67-340201f53b2e",
    },
};
// =========================================================

async function uploadVideoOnly(filePath) {
    if (!filePath) {
        throw new Error("Missing file path. Example: node upload-bunny.mjs ./video.mp4");
    }

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
    }

    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);

    const upload = new tus.Upload(fileStream, {
        endpoint: session.upload.endpoint,

        // Node + stream: nên truyền uploadSize
        uploadSize: stat.size,

        // Nếu gặp lỗi stream/chunk thì giữ chunkSize hữu hạn như này
        chunkSize: 8 * 1024 * 1024, // 8MB

        retryDelays: [0, 3000, 5000, 10000, 20000],

        headers: {
            AuthorizationSignature: session.upload.authorizationSignature,
            AuthorizationExpire: String(session.upload.authorizationExpire),
            VideoId: session.upload.videoId,
            LibraryId: String(session.upload.libraryId),
        },

        metadata: {
            filetype: "video/mp4",
            title: fileName,
        },

        onError(error) {
            console.error("upload failed:");
            console.error(error);
            process.exitCode = 1;
        },

        onProgress(bytesUploaded, bytesTotal) {
            const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            process.stdout.write(
                `\rupload progress: ${percent}% (${bytesUploaded}/${bytesTotal})`
            );
        },

        onSuccess() {
            console.log("\nupload done");
            console.log("videoId:", session.upload.videoId);
            console.log("uploadUrl:", upload.url);
        },
    });

    // Node không có Web Storage như browser, nên resume tự động không ngon như browser.
    // Test terminal cơ bản thì cứ start luôn là đủ.
    upload.start();
}

const filePath = process.argv[2];
uploadVideoOnly(filePath).catch((err) => {
    console.error(err);
    process.exit(1);
});