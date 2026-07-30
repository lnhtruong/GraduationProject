export const highlightShowcase = {
  source: {
    id: 1,
    title: "Phân Từ | TOEIC Grammar - Lesson 5: Participles",
    course: "TOEIC Grammar Foundation",
    duration: "49:53",
    video:
      "https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/play_360p.mp4",
    thumbnail:
      "https://vz-e0f2a12f-935.b-cdn.net/10506623-c382-4062-bb6c-27c8185fed19/thumbnail.jpg",
  },
  highlights: [
    {
      id: "toeic-participles-concept",
      videoId: 32,
      feedId: 1,
      label: "Khái niệm",
      title: "Introduction to Participles",
      duration: "02:01",
      video:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4",
      thumbnail:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg",
    },
    {
      id: "toeic-participles-meaning",
      videoId: 33,
      feedId: 2,
      label: "Ngữ nghĩa",
      title: "Active vs. Passive Meaning",
      duration: "02:00",
      video:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4",
      thumbnail:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg",
    },
    {
      id: "toeic-participles-practice",
      videoId: 34,
      feedId: 3,
      label: "Luyện tập",
      title: "Practice Exercises",
      duration: "03:20",
      video:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4",
      thumbnail:
        "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg",
    },
  ],
} as const;

export type HighlightShowcaseItem = (typeof highlightShowcase.highlights)[number];
