# Hướng dẫn chạy colab và deploy inference service
1. chạy 'yarn build' cho tất cả các service
2. mở git bash, kéo file vào git bash deploy_ngrok.sh ở root folder và chạy
3. copy url của ngrok
4. Truy cập vào [qstash](https://console.upstash.com/qstash), tạo tài khoản, đăng nhập.
5. Chọn một region, suggest chọn EU.
6. Copy QSTASH_TOKEN để dùng khi chạy colab
6. Nhấn qua tab URL Group, tạo một URL GROUP và paste link ngrok với format
``` PUBLIC_NGROK_URL/api/media/webhooks/ai-model/result```
7. Ở cell thứ 8 tên 'tạo file main.py' paste QSTASH_TOKEN của bạn vào.
8. Chạy tất cả cell colab, lấy link deploy của colab, paste vào file .env của inference service
9. chạy 
```cd backend_services/inference_service
yarn build
```
10. mở lại git bash deploy ngrok ctrl + C và chạy lại.