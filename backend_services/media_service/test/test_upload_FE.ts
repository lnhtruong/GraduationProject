import * as tus from "tus-js-client";

async function uploadVideoOnly(file: File) {
  const session = {
    upload: {
      endpoint: "https://video.bunnycdn.com/tusupload",
      authorizationSignature: "PASTE_SIGNATURE_HERE",
      authorizationExpire: "PASTE_EXPIRE_HERE",
      videoId: "PASTE_VIDEO_ID_HERE",
      libraryId: "PASTE_LIBRARY_ID_HERE",
    },
  };

  const upload = new tus.Upload(file, {
    endpoint: session.upload.endpoint,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      AuthorizationSignature: session.upload.authorizationSignature,
      AuthorizationExpire: String(session.upload.authorizationExpire),
      VideoId: session.upload.videoId,
      LibraryId: String(session.upload.libraryId),
    },
    metadata: {
      filetype: file.type || "video/mp4",
      title: file.name,
    },
    onProgress(bytesUploaded, bytesTotal) {
      const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      console.log("upload progress:", percent + "%");
    },
    onError(error) {
      console.error("upload failed:", error);
    },
    onSuccess() {
      console.log("upload done");
      console.log("videoId:", session.upload.videoId);
    },
  });

  const previousUploads = await upload.findPreviousUploads();
  if (previousUploads.length) {
    upload.resumeFromPreviousUpload(previousUploads[0]);
  }

  upload.start();
}