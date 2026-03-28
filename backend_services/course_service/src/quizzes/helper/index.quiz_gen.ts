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
// [
//   {
//     "index": 11,
//     "start": "00:00:45,750",
//     "end": "00:00:55,130",
//     "text": "Sau trời, chúng ta các hành tinh luôn phút tạp như Pluto và Sirius."
//   },
//   {
//     "index": 12,
//     "start": "00:00:55,130",
//     "end": "00:00:59,530",
//     "text": "Vậy, chính xác thì hệ mặt trời đã hình hành như thế nào?"
//   },
//   {
//     "index": 14,
//     "start": "00:01:01,930",
//     "end": "00:01:06,330",
//     "text": "Tại sao các thiên khẩy lại ở đúng vị trí như hiện nay?"
//   },
//   {
//     "index": 15,
//     "start": "00:01:06,330",
//     "end": "00:01:11,330",
//     "text": "Giấy đây là chuỗi sự kiện đã kiến tạo và định hình nên hệ mặt trời của chúng ta."
//   },
//   {
//     "index": 20,
//     "start": "00:01:27,440",
//     "end": "00:01:31,440",
//     "text": "13.8 tỷ năm trước, bức ban tạo giáo vũ chủ."
//   },
//   {
//     "index": 21,
//     "start": "00:01:31,440",
//     "end": "00:01:39,760",
//     "text": "4.6 tỷ năm trước, 1 nhóm tiền sau Protosta"
//   },
//   {
//     "index": 22,
//     "start": "00:01:39,760",
//     "end": "00:01:44,760",
//     "text": "thinh hành từ sự xuất đổ của các mạnh bên trong một đảm mây phần tử khổng lồ."
//   },
//   {
//     "index": 24,
//     "start": "00:01:47,760",
//     "end": "00:01:53,760",
//     "text": "Có là tinh bên mặt trời, solar nebula, rộng khoảng 3,26 năm mạnh sáng."
//   },
//   {
//     "index": 26,
//     "start": "00:01:56,760",
//     "end": "00:02:00,760",
//     "text": "Quay quan trung tâm của dạng An Hà, chứ 99% khí."
//   },
//   {
//     "index": 27,
//     "start": "00:02:00,760",
//     "end": "00:02:05,760",
//     "text": "Chủ yếu là Hydero và 1 ít Hely và 1% buổi."
//   },
//   {
//     "index": 28,
//     "start": "00:02:06,760",
//     "end": "00:02:11,760",
//     "text": "Buổi trong đảm mây phần tử, Waller Killer Cloud, là các hạt xeo nhỏ."
//   },
//   {
//     "index": 29,
//     "start": "00:02:11,760",
//     "end": "00:02:15,760",
//     "text": "Chưa các quyền tối nặng như các bòn, xin lích, cozy và sát."
//   },
//   {
//     "index": 30,
//     "start": "00:02:15,760",
//     "end": "00:02:19,760",
//     "text": "Được hình thành từ những buồn nổ sau trước đó, trong đảnh An Hà."
//   },
//   {
//     "index": 31,
//     "start": "00:02:19,760",
//     "end": "00:02:23,760",
//     "text": "Nở cách khác, cái chế, vừa các hồi sau khác,"
//   },
//   {
//     "index": 33,
//     "start": "00:02:26,760",
//     "end": "00:02:31,760",
//     "text": "Xong xung kích từ 1 hoặc nhiều số tân tình, phân nổ gần tình phân mặt trời."
//   },
//   {
//     "index": 34,
//     "start": "00:02:31,760",
//     "end": "00:02:36,760",
//     "text": "Có thể đã gây ra xử sáu chuẩn lăn dốc, tiết hoạt quá trình xuất đồ không dẫn."
//   },
//   {
//     "index": 35,
//     "start": "00:02:36,760",
//     "end": "00:02:42,760",
//     "text": "Trong 100.000 năm tiếp theo, 80 này đã xuất đồ thành nhiều vật thể nổng và nặng,"
//   },
//   {
//     "index": 36,
//     "start": "00:02:42,760",
//     "end": "00:02:50,830",
//     "text": "gọi là tiền sau trong đó có mặt trời vào chúng ta."
//   },
//   {
//     "index": 37,
//     "start": "00:02:50,830",
//     "end": "00:02:56,830",
//     "text": "Trong quá trình đó, sứ bảo toàn đồng lượng góc, khiến cho tình bân mặt trời mắt đầu quay."
//   },
//   {
//     "index": 38,
//     "start": "00:02:56,830",
//     "end": "00:03:00,830",
//     "text": "Theo thời gian, tình bân mặt trời quay ngày càng ngành, trở nên rẹp"
//   },
//   {
//     "index": 43,
//     "start": "00:03:12,830",
//     "end": "00:03:18,430",
//     "text": "Trong lúc mặt trời xưa sinh, tích cực tích lưỡi yên vật nhiều."
//   },
//   {
//     "index": 45,
//     "start": "00:03:21,430",
//     "end": "00:03:25,430",
//     "text": "3 chạm nỗ nhân, và sĩ bảo nhau, phát triển trong chỉ vài năm,"
//   },
//   {
//     "index": 47,
//     "start": "00:03:29,430",
//     "end": "00:03:33,430",
//     "text": "Đầu này cuối cùng rất đến nặng bù và chạm, và 3 sự bùi tụi thêm bật chát,"
//   },
//   {
//     "index": 49,
//     "start": "00:03:35,430",
//     "end": "00:03:40,430",
//     "text": "Protoplanet có kích thước tương đường mặt trang trong trưa này một chậu năm."
//   },
//   {
//     "index": 50,
//     "start": "00:03:40,430",
//     "end": "00:03:46,430",
//     "text": "4,59 tỷ nằm trước, các hành tình khổng lồ, mộc tình, thổ tình,"
//   },
//   {
//     "index": 51,
//     "start": "00:03:46,430",
//     "end": "00:03:51,430",
//     "text": "kênh bân tình và hải tương tình, thình thành, sôn quan tình mặt trời."
//   },
//   {
//     "index": 57,
//     "start": "00:04:05,430",
//     "end": "00:04:10,430",
//     "text": "và đủ lớn để thu hút công viên tối nhẹ, như hư tử rù và heli."
//   },
//   {
//     "index": 59,
//     "start": "00:04:13,430",
//     "end": "00:04:18,430",
//     "text": "sau khi hệ mặt trời ra đời, làm cho nó trở thành hành tình lâu nổi nhất."
//   },
//   {
//     "index": 62,
//     "start": "00:04:22,430",
//     "end": "00:04:26,430",
//     "text": "vì mục tiền đã bờ vét mà phần lớn bình ngoại diễn."
//   },
//   {
//     "index": 63,
//     "start": "00:04:26,430",
//     "end": "00:04:29,430",
//     "text": "Cái gì đâu? Cái gì là của em? Cái gì là bài trấu vào?"
//   },
//   {
//     "index": 64,
//     "start": "00:04:29,430",
//     "end": "00:04:32,430",
//     "text": "Khi thiền phân tình và hải phân tình làm giải khai tình,"
//   },
//   {
//     "index": 65,
//     "start": "00:04:32,430",
//     "end": "00:04:35,430",
//     "text": "chỉ còn lại rất ít thì rồ và heli."
//   },
//   {
//     "index": 66,
//     "start": "00:04:35,430",
//     "end": "00:04:39,430",
//     "text": "Vì vậy, hay nữa đành tích lưỡi ít nhồ và chất băng hơn,"
//   },
//   {
//     "index": 68,
//     "start": "00:04:41,430",
//     "end": "00:04:45,430",
//     "text": "Bì lý do này, chúng ta gọi chúng là các hành tình băng khổng lồ."
//   },
//   {
//     "index": 69,
//     "start": "00:04:45,430",
//     "end": "00:04:48,430",
//     "text": "Trong khi hài mẽ bự ở làm một và thổ ta,"
//   },
//   {
//     "index": 70,
//     "start": "00:04:48,430",
//     "end": "00:04:52,430",
//     "text": "tình, gọi là các hành tình khí khổng lồ."
//   },
//   {
//     "index": 72,
//     "start": "00:04:54,430",
//     "end": "00:04:57,430",
//     "text": "có thể đã có thể một số hành tình băng khá thình thành,"
//   },
//   {
//     "index": 73,
//     "start": "00:04:57,430",
//     "end": "00:05:00,430",
//     "text": "dừng quấy cùng đều bây nếm xa khỏi hệ mặt trời."
//   },
//   {
//     "index": 74,
//     "start": "00:05:00,430",
//     "end": "00:05:03,430",
//     "text": "Chúng ta sẽ nói kỹ hơn ở phần sau."
//   },
//   {
//     "index": 75,
//     "start": "00:05:03,430",
//     "end": "00:05:06,430",
//     "text": "Bây giờ quân học cho rằng các hành tình khổng lồ,"
//   },
//   {
//     "index": 78,
//     "start": "00:05:10,430",
//     "end": "00:05:13,430",
//     "text": "ít nhất là đối với trên vương và phà hải phân tình."
//   },
//   {
//     "index": 82,
//     "start": "00:05:19,430",
//     "end": "00:05:23,430",
//     "text": "Tách mặt trời lần lượt lất 19,3-30 lần,"
//   },
//   {
//     "index": 86,
//     "start": "00:05:29,430",
//     "end": "00:05:32,430",
//     "text": "cáo dài trong phòng vị quý đạo hiện tài của thiền vương"
//   },
//   {
//     "index": 88,
//     "start": "00:05:33,430",
//     "end": "00:05:36,430",
//     "text": "đồng thời, công tình dày đặt hơn nhiều lần"
//   },
//   {
//     "index": 90,
//     "start": "00:05:38,430",
//     "end": "00:05:41,430",
//     "text": "4,25 tỷ năm trước,"
//   },
//   {
//     "index": 91,
//     "start": "00:05:41,430",
//     "end": "00:05:44,430",
//     "text": "mặt trời baby bắt đầu quá trình tổng hợp hành nhân"
//   },
//   {
//     "index": 93,
//     "start": "00:05:46,430",
//     "end": "00:05:49,430",
//     "text": "nhưng tiền sản mặt trời đồ tiền phát hiện."
//   },
//   {
//     "index": 94,
//     "start": "00:05:49,430",
//     "end": "00:05:54,690",
//     "text": "Mặt trời em bé vào chúng ta"
//   },
//   {
//     "index": 98,
//     "start": "00:06:00,690",
//     "end": "00:06:03,690",
//     "text": "khiến nhật đồ ở vã phát trời lên quá lưỡng."
//   },
//   {
//     "index": 104,
//     "start": "00:06:09,690",
//     "end": "00:06:14,360",
//     "text": "Năng lượng dài phóng tưu và nữ tổng hợp hành nhân"
//   },
//   {
//     "index": 109,
//     "start": "00:06:20,360",
//     "end": "00:06:23,360",
//     "text": "vừa ngăn không cho nó tích tùa thêm phát trách"
//   },
//   {
//     "index": 112,
//     "start": "00:06:27,360",
//     "end": "00:06:30,360",
//     "text": "mặt trời đặt tới trận thái cân bằng thủy tĩnh,"
//   },
//   {
//     "index": 122,
//     "start": "00:06:45,360",
//     "end": "00:06:49,360",
//     "text": "và sẽ duy trì như vậy trong khoảng 5 tỷ năm nữa."
//   },
//   {
//     "index": 131,
//     "start": "00:07:00,360",
//     "end": "00:07:03,360",
//     "text": "và các mạnh vỡ tạo thành mặt trang."
//   },
//   {
//     "index": 137,
//     "start": "00:07:11,360",
//     "end": "00:07:14,360",
//     "text": "vì nhật độ tại đây quá cao để nước"
//   },
//   {
//     "index": 148,
//     "start": "00:07:31,360",
//     "end": "00:07:36,970",
//     "text": "Các hành tình phía trong không lớn"
//   },
//   {
//     "index": 155,
//     "start": "00:07:44,970",
//     "end": "00:07:49,340",
//     "text": "các đám bây phần tử mà đầu."
//   },
//   {
//     "index": 161,
//     "start": "00:07:59,340",
//     "end": "00:08:03,940",
//     "text": "Bây giờ gọi là giả thuyết buổi 3 trạng lớn,"
//   },
//   {
//     "index": 164,
//     "start": "00:08:07,940",
//     "end": "00:08:10,940",
//     "text": "có thể đã trải qua một buổi 3 trạng tốc nổ cao"
//   },
//   {
//     "index": 166,
//     "start": "00:08:11,940",
//     "end": "00:08:14,940",
//     "text": "khiến lất bỏ ngoài của nó bị lột bỏ."
//   },
//   {
//     "index": 174,
//     "start": "00:08:30,940",
//     "end": "00:08:33,940",
//     "text": "Một tình đã găng càn đặc hình thể lớn"
//   },
//   {
//     "index": 177,
//     "start": "00:08:36,940",
//     "end": "00:08:39,940",
//     "text": "vì được hợp dẫn siêu trọng vào nó."
//   },
//   {
//     "index": 188,
//     "start": "00:08:59,940",
//     "end": "00:09:02,940",
//     "text": "tổng trọng lượng chưa tới một phần trạng trái đất."
//   },
//   {
//     "index": 204,
//     "start": "00:09:32,760",
//     "end": "00:09:37,600",
//     "text": "Tao ra những hành tình luôn,"
//   },
//   {
//     "index": 232,
//     "start": "00:10:22,960",
//     "end": "00:10:25,960",
//     "text": "cuối cùng hợp lại thành 4 bật chăng không lồ"
//   },
//   {
//     "index": 236,
//     "start": "00:10:29,960",
//     "end": "00:10:38,740",
//     "text": "bật chăng thay tình của xa thuộc"
//   },
//   {
//     "index": 237,
//     "start": "00:10:38,740",
//     "end": "00:10:41,740",
//     "text": "có thể cung hình thành theo cách tường tư."
//   },
//   {
//     "index": 242,
//     "start": "00:10:48,740",
//     "end": "00:10:55,090",
//     "text": "Có thể tình là những hành tình tục lập"
//   },
//   {
//     "index": 253,
//     "start": "00:11:12,090",
//     "end": "00:11:15,090",
//     "text": "khổi ra từ mặt trời còn trẻ 3 khỏe,"
//   },
//   {
//     "index": 270,
//     "start": "00:11:43,470",
//     "end": "00:11:45,470",
//     "text": "sẽ có trong phần hai,"
//   }
// ]
// `
//   const quizPayload = await generateQuizPayload(srtRaw)
//   console.log(JSON.stringify(quizPayload, null, 2))
// }

// test()
