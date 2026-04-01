import { createQuiz, QuizPayload } from "./quiz.gen"

export async function generateQuizPayload(srtRaw: string, quizName: string, shuffQues: boolean, shuffOps: boolean, passScore: number, timeLimit: number): Promise<QuizPayload> {
  return createQuiz(srtRaw, {
    name: quizName || "Quiz 1",
    shuffleQuestion: shuffQues,
    shuffleOption: shuffOps,
    passingScore: passScore,
    timeLimitMinutes: timeLimit,
  }, { TOPIC: quizName || "DSA", PCT_MCQ: 60, PCT_TRUE_FALSE: 20, PCT_SHORT_TEXT: 20 })
}


// async function test() {
//   const srtRaw = `
//   20
// 00:01:27.440->00:01:31.440
// 13.8 tỷ năm trước, bức ban tạo giáo vũ chủ.

// 21
// 00:01:31.440->00:01:39.760
// 4.6 tỷ năm trước, 1 nhóm tiền sau Protosta

// 22
// 00:01:39.760->00:01:44.760
// thinh hành từ sự xuất đổ của các mạnh bên trong một đảm mây phần tử khổng lồ.

// 23
// 00:01:44.760->00:01:47.760
// Trong đó, mạnh đã hình hành nên hệ mặt trời.

// 24
// 00:01:47.760->00:01:53.760
// Có là tinh bên mặt trời, solar nebula, rộng khoảng 3,26 năm mạnh sáng.

// 25
// 00:01:53.760->00:01:56.760
// Đảm mây lớn rộng khoảng 65 năm mạnh sáng.

// 26
// 00:01:56.760->00:02:00.760
// Quay quan trung tâm của dạng An Hà, chứ 99% khí.

// 27
// 00:02:00.760->00:02:05.760
// Chủ yếu là Hydero và 1 ít Hely và 1% buổi.

// 28
// 00:02:06.760->00:02:11.760
// Buổi trong đảm mây phần tử, Waller Killer Cloud, là các hạt xeo nhỏ.

// 29
// 00:02:11.760->00:02:15.760
// Chưa các quyền tối nặng như các bòn, xin lích, cozy và sát.

// 30
// 00:02:15.760->00:02:19.760
// Được hình thành từ những buồn nổ sau trước đó, trong đảnh An Hà.

// 31
// 00:02:19.760->00:02:23.760
// Nở cách khác, cái chế, vừa các hồi sau khác,

// 32
// 00:02:23.760->00:02:26.760
// nào có phần tạo ra 10 sau vào chúng ta.

// 33
// 00:02:26.760->00:02:31.760
// Xong xung kích từ 1 hoặc nhiều số tân tình, phân nổ gần tình phân mặt trời.

// 34
// 00:02:31.760->00:02:36.760
// Có thể đã gây ra xử sáu chuẩn lăn dốc, tiết hoạt quá trình xuất đồ không dẫn.

// 35
// 00:02:36.760->00:02:42.760
// Trong 100.000 năm tiếp theo, 80 này đã xuất đồ thành nhiều vật thể nổng và nặng,

// 36
// 00:02:42.760->00:02:50.830
// gọi là tiền sau trong đó có mặt trời vào chúng ta.

// 37
// 00:02:50.830->00:02:56.830
// Trong quá trình đó, sứ bảo toàn đồng lượng góc, khiến cho tình bân mặt trời mắt đầu quay.

// 38
// 00:02:56.830->00:03:00.830
// Theo thời gian, tình bân mặt trời quay ngày càng ngành, trở nên rẹp

// 39
// 00:03:00.830->00:03:03.830
// và bà dân tạo thành một điếp tiền hành tình.

// 40
// 00:03:03.830->00:03:06.830
// Protoplanet tellerides, đừng kính khoảng 200 đêm vị thêm bán,

// 41
// 00:03:06.830->00:03:09.830
// ở với 11 sau xưa sinh, ở chung tâm.

// 42
// 00:03:09.830->00:03:12.830
// Chính là kênh bản chưa cây sữa của mặt trời.

// 43
// 00:03:12.830->00:03:18.430
// Trong lúc mặt trời xưa sinh, tích cực tích lưỡi yên vật nhiều.

// 44
// 00:03:18.430->00:03:21.430
// Nhưng hạt bùi nhỏ trong những bật cháp sùng bài nỏ,

// 45
// 00:03:21.430->00:03:25.430
// 3 chạm nỗ nhân, và sĩ bảo nhau, phát triển trong chỉ vài năm,

// 46
// 00:03:25.430->00:03:28.430
// thành nhân thiên thiền có đừng tính hẳng chạm mét.

// 47
// 00:03:29.430->00:03:33.430
// Đầu này cuối cùng rất đến nặng bù và chạm, và 3 sự bùi tụi thêm bật chát,

// 49
// 00:03:35.430->00:03:40.430
// Protoplanet có kích thước tương đường mặt trang trong trưa này một chậu năm.

// 50
// 00:03:40.430->00:03:46.430
// 4,59 tỷ nằm trước, các hành tình khổng lồ, mộc tình, thổ tình,

// 51
// 00:03:46.430->00:03:51.430
// kênh bân tình và hải tương tình, thình thành, sôn quan tình mặt trời.

// 52
// 00:03:51.430->00:03:54.430
// Tại phần ria mắt mẹ hơn của điếp tiền hành tình,

// 53
// 00:03:54.430->00:03:57.430
// khí và băng nước đã thành phần chủ yếu.

// 54
// 00:03:57.430->00:04:00.430
// Tại đây, được hấp dẫn yếu hơn của mặt trời,

// 56
// 00:04:02.430->00:04:05.430
// đã giúp các tiền hành tình phát triển danh chống

// 57
// 00:04:05.430->00:04:10.430
// và đủ lớn để thu hút công viên tối nhẹ, như hư tử rù và heli.

// 58
// 00:04:10.430->00:04:13.430
// Kết quả là 1 tình hình hành trưa này 3 chậu năm

// 59
// 00:04:13.430->00:04:18.430
// sau khi hệ mặt trời ra đời, làm cho nó trở thành hành tình lâu nổi nhất.

// 62
// 00:04:22.430->00:04:26.430
// vì mục tiền đã bờ vét mà phần lớn bình ngoại diễn.

// 63
// 00:04:26.430->00:04:29.430
// Cái gì đâu? Cái gì là của em? Cái gì là bài trấu vào?

// 64
// 00:04:29.430->00:04:32.430
// Khi thiền phân tình và hải phân tình làm giải khai tình,

// 65
// 00:04:32.430->00:04:35.430
// chỉ còn lại rất ít thì rồ và heli.

// 66
// 00:04:35.430->00:04:39.430
// Vì vậy, hay nữa đành tích lưỡi ít nhồ và chất băng hơn,

// 68
// 00:04:41.430->00:04:45.430
// Bì lý do này, chúng ta gọi chúng là các hành tình băng khổng lồ.

// 69
// 00:04:45.430->00:04:48.430
// Trong khi hài mẽ bự ở làm một và thổ ta,

// 70
// 00:04:48.430->00:04:52.430
// tình, gọi là các hành tình khí khổng lồ.

// 72
// 00:04:54.430->00:04:57.430
// có thể đã có thể một số hành tình băng khá thình thành,

// 73
// 00:04:57.430->00:05:00.430
// dừng quấy cùng đều bây nếm xa khỏi hệ mặt trời.

// 74
// 00:05:00.430->00:05:03.430
// Chúng ta sẽ nói kỹ hơn ở phần sau.

// 75
// 00:05:03.430->00:05:06.430
// Bây giờ quân học cho rằng các hành tình khổng lồ,

// 78
// 00:05:10.430->00:05:13.430
// ít nhất là đối với trên vương và phà hải phân tình.

// 82
// 00:05:19.430->00:05:23.430
// Tách mặt trời lần lượt lất 19,3-30 lần,

// 86
// 00:05:29.430->00:05:32.430
// cáo dài trong phòng vị quý đạo hiện tài của thiền vương

// 88
// 00:05:33.430->00:05:36.430
// đồng thời, công tình dày đặt hơn nhiều lần

// 90
// 00:05:38.430->00:05:41.430
// 4,25 tỷ năm trước,

// 91
// 00:05:41.430->00:05:44.430
// mặt trời baby bắt đầu quá trình tổng hợp hành nhân

// 93
// 00:05:46.430->00:05:49.430
// nhưng tiền sản mặt trời đồ tiền phát hiện.

// 94
// 00:05:49.430->00:05:54.690
// Mặt trời em bé vào chúng ta

// 98
// 00:06:00.690->00:06:03.690
// khiến nhật đồ ở vã phát trời lên quá lưỡng.

// 104
// 00:06:09.690->00:06:14.360
// Năng lượng dài phóng tưu và nữ tổng hợp hành nhân

// 109
// 00:06:20.360->00:06:23.360
// vừa ngăn không cho nó tích tùa thêm phát trách

// 112
// 00:06:27.360->00:06:30.360
// mặt trời đặt tới trận thái cân bằng thủy tĩnh,

// 122
// 00:06:45.360->00:06:49.360
// và sẽ duy trì như vậy trong khoảng 5 tỷ năm nữa.

// 131
// 00:07:00.360->00:07:03.360
// và các mạnh vỡ tạo thành mặt trang.

// 137
// 00:07:11.360->00:07:14.360
// vì nhật độ tại đây quá cao để nước

// 148
// 00:07:31.360->00:07:36.970
// Các hành tình phía trong không lớn

// 155
// 00:07:44.970->00:07:49.340
// các đám bây phần tử mà đầu.

// 161
// 00:07:59.340->00:08:03.940
// Bây giờ gọi là giả thuyết buổi 3 trạng lớn,

// 164
// 00:08:07.940->00:08:10.940
// có thể đã trải qua một buổi 3 trạng tốc nổ cao

// 166
// 00:08:11.940->00:08:14.940
// khiến lất bỏ ngoài của nó bị lột bỏ.

// 173
// 00:08:27.940->00:08:29.940
// hay bị tạo ra một mặt trang.

// 174
// 00:08:30.940->00:08:33.940
// Một tình đã găng càn đặc hình thể lớn

// 175
// 00:08:33.940->00:08:35.940
// thình hành bên trong bành này cho hành tình

// 177
// 00:08:36.940->00:08:39.940
// vì được hợp dẫn siêu trọng vào nó.

// 178
// 00:08:39.940->00:08:41.940
// Nát kéo vào những hành tình sơ khai

// 179
// 00:08:41.940->00:08:43.940
// vào phía thích lất tương đường mặt trang

// 181
// 00:08:44.940->00:08:46.940
// khiến chúng vào trang và vỡ bôn

// 182
// 00:08:46.940->00:08:48.940
// hoặc là di cư, còi cầu bật này.

// 183
// 00:08:49.940->00:08:51.940
// Quá trình này kéo dài vài chục chổ năm

// 184
// 00:08:51.940->00:08:53.940
// sau khi một tình hình hành.
// `
//   const quizPayload = await generateQuizPayload(srtRaw, true, true, 80, 10)
//   console.log(JSON.stringify(quizPayload, null, 2))
// }

// test()
  






// ==========RESULT============

// {
//   "name": "Quiz 1",
//   "shuffleQuestion": true,
//   "shuffleOption": true,
//   "passingScore": 80,
//   "timeLimitMinutes": 10,
//   "questions": [
//     {
//       "quesType": "mcq",
//       "quesText": "How many years ago did the solar system begin to form?",
//       "point": 1,
//       "correctExplanation": "The solar system began to form approximately 4.6 billion years ago.",
//       "orderIndex": 1,
//       "options": [
//         {
//           "optionText": {
//             "optionText": "4.6 billion years ago",
//             "isCorrect": true,
//             "orderIndex": 1
//           },
//           "isCorrect": true,
//           "orderIndex": 1
//         },
//         {
//           "optionText": {
//             "optionText": "13.8 billion years ago",
//             "isCorrect": false,
//             "orderIndex": 2
//           },
//           "isCorrect": false,
//           "orderIndex": 2
//         },
//         {
//           "optionText": {
//             "optionText": "3.26 billion years ago",
//             "isCorrect": false,
//             "orderIndex": 3
//           },
//           "isCorrect": false,
//           "orderIndex": 3
//         },
//         {
//           "optionText": {
//             "optionText": "100,000 years ago",
//             "isCorrect": false,
//             "orderIndex": 4
//           },
//           "isCorrect": false,
//           "orderIndex": 4
//         }
//       ],
//       "evidence": "00:01:31,440"
//     },
//     {
//       "quesType": "true_false",
//       "quesText": "The solar nebula was primarily composed of hydrogen and helium.",
//       "point": 1,
//       "correctExplanation": "The solar nebula was mainly made up of hydrogen and a small amount of helium.",
//       "orderIndex": 2,
//       "options": [
//         {
//           "optionText": "True",
//           "isCorrect": true,
//           "orderIndex": 1
//         },
//         {
//           "optionText": "False",
//           "isCorrect": false,
//           "orderIndex": 2
//         }
//       ],
//       "evidence": "00:02:00,760"
//     },
//     {
//       "quesType": "short_text",
//       "quesText": "What is the term used for the early stages of planet formation?",
//       "point": 2,
//       "correctExplanation": "Protoplanets are the early stages of planet formation.",
//       "orderIndex": 3,
//       "options": [],
//       "evidence": "00:03:03,830"
//     },
//     {
//       "quesType": "mcq",
//       "quesText": "What caused the solar nebula to collapse and form the solar system?",
//       "point": 1,
//       "correctExplanation": "Shock waves from nearby supernovae likely triggered the collapse of the solar nebula.",
//       "orderIndex": 4,
//       "options": [
//         {
//           "optionText": {
//             "optionText": "Shock waves from nearby supernovae",
//             "isCorrect": true,
//             "orderIndex": 1
//           },
//           "isCorrect": true,
//           "orderIndex": 1
//         },
//         {
//           "optionText": {
//             "optionText": "Gravitational pull from the Earth",
//             "isCorrect": false,
//             "orderIndex": 2
//           },
//           "isCorrect": false,
//           "orderIndex": 2
//         },
//         {
//           "optionText": {
//             "optionText": "Collision with another galaxy",
//             "isCorrect": false,
//             "orderIndex": 3
//           },
//           "isCorrect": false,
//           "orderIndex": 3
//         },
//         {
//           "optionText": {
//             "optionText": "Solar winds",
//             "isCorrect": false,
//             "orderIndex": 4
//           },
//           "isCorrect": false,
//           "orderIndex": 4
//         }
//       ],
//       "evidence": "00:02:31,760"
//     },
//     {
//       "quesType": "true_false",
//       "quesText": "The inner planets are primarily gas giants.",
//       "point": 1,
//       "correctExplanation": "The inner planets are rocky, while the outer planets are gas giants.",
//       "orderIndex": 5,
//       "options": [
//         {
//           "optionText": "True",
//           "isCorrect": false,
//           "orderIndex": 1
//         },
//         {
//           "optionText": "False",
//           "isCorrect": true,
//           "orderIndex": 2
//         }
//       ],
//       "evidence": "00:04:45,430"
//     },
//     {
//       "quesType": "short_text",
//       "quesText": "What is the main component that allowed gas giants to form?",
//       "point": 2,
//       "correctExplanation": "Hydrogen was the main component that allowed gas giants to form.",
//       "orderIndex": 6,
//       "options": [],
//       "evidence": "00:04:10,430"
//     },
//     {
//       "quesType": "mcq",
//       "quesText": "Which of the following is NOT a gas giant?",
//       "point": 1,
//       "correctExplanation": "Earth is a terrestrial planet, not a gas giant.",
//       "orderIndex": 7,
//       "options": [
//         {
//           "optionText": {
//             "optionText": "Jupiter",
//             "isCorrect": false,
//             "orderIndex": 1
//           },
//           "isCorrect": false,
//           "orderIndex": 1
//         },
//         {
//           "optionText": {
//             "optionText": "Saturn",
//             "isCorrect": false,
//             "orderIndex": 2
//           },
//           "isCorrect": false,
//           "orderIndex": 2
//         },
//         {
//           "optionText": {
//             "optionText": "Earth",
//             "isCorrect": true,
//             "orderIndex": 3
//           },
//           "isCorrect": true,
//           "orderIndex": 3
//         },
//         {
//           "optionText": {
//             "optionText": "Neptune",
//             "isCorrect": false,
//             "orderIndex": 4
//           },
//           "isCorrect": false,
//           "orderIndex": 4
//         }
//       ],
//       "evidence": "00:04:51,430"
//     },
//     {
//       "quesType": "true_false",
//       "quesText": "The formation of the solar system took place over a few million years.",
//       "point": 1,
//       "correctExplanation": "The formation of the solar system took place over billions of years, not just millions.",
//       "orderIndex": 8,
//       "options": [
//         {
//           "optionText": "True",
//           "isCorrect": false,
//           "orderIndex": 1
//         },
//         {
//           "optionText": "False",
//           "isCorrect": true,
//           "orderIndex": 2
//         }
//       ],
//       "evidence": "00:02:42,760"
//     },
//     {
//       "quesType": "short_text",
//       "quesText": "What is the name of the process that maintains the sun's balance?",
//       "point": 2,
//       "correctExplanation": "Hydrostatic equilibrium is the process that maintains the sun's balance.",
//       "orderIndex": 9,
//       "options": [],
//       "evidence": "00:06:30,360"
//     },
//     {
//       "quesType": "mcq",
//       "quesText": "What will happen to the sun in about 5 billion years?",
//       "point": 1,
//       "correctExplanation": "In about 5 billion years, the sun is expected to expand into a red giant.",
//       "orderIndex": 10,
//       "options": [
//         {
//           "optionText": {
//             "optionText": "It will explode as a supernova",
//             "isCorrect": false,
//             "orderIndex": 1
//           },
//           "isCorrect": false,
//           "orderIndex": 1
//         },
//         {
//           "optionText": {
//             "optionText": "It will become a red giant",
//             "isCorrect": true,
//             "orderIndex": 2
//           },
//           "isCorrect": true,
//           "orderIndex": 2
//         },
//         {
//           "optionText": {
//             "optionText": "It will remain unchanged",
//             "isCorrect": false,
//             "orderIndex": 3
//           },
//           "isCorrect": false,
//           "orderIndex": 3
//         },
//         {
//           "optionText": {
//             "optionText": "It will collapse into a black hole",
//             "isCorrect": false,
//             "orderIndex": 4
//           },
//           "isCorrect": false,
//           "orderIndex": 4
//         }
//       ],
//       "evidence": "00:06:45,360"
//     }
//   ]
// }