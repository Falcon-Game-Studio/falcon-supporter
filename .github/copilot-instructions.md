# Falcon Supporter — Copilot Instructions

## Tổng quan dự án

**Falcon Supporter** là hệ thống Chăm sóc Khách hàng (CSKH) tích hợp AI Agent cho một game studio.
Hệ thống giúp tự động hóa quy trình xử lý yêu cầu hỗ trợ của người chơi (player) và học hỏi liên tục từ các tình huống đã giải quyết.

### Mục tiêu cốt lõi

- **Tự động hóa**: AI Agent tự động chat với user, nhận diện vấn đề và đề xuất giải pháp.
- **Tự học**: AI liên tục học từ các case đã resolve để nâng cao khả năng xử lý.
- **Giảm tải**: Giảm khối lượng công việc cho đội CSKH bằng cách tự động xử lý tình huống quen thuộc.

## Cấu trúc dự án

```
falcon-supporter/
├── frontend/          # Chat UI (React / HTML đơn giản)
├── backend/           # REST API Server + AI Agent logic
│   ├── data/
│   │   ├── players.csv         # DB người chơi (id, username, gold, ...)
│   │   ├── knowledge_base.json # Các case mẫu đã resolve
│   │   ├── conversations.json  # Lịch sử hội thoại theo player_id
│   │   └── pending_reviews.json# Mock PR chờ CSKH duyệt
├── docs/              # Tài liệu Docusaurus (chạy bằng npm run docs)
```

## Luồng hoạt động chính

### 1. Xác định người dùng

- Khi user mở frontend, hệ thống hỏi **Player ID** (ví dụ: `P001`).
- Frontend gửi Player ID lên backend để xác thực và lưu vào cookie.
- Cookie giúp ghi nhớ session: lần sau mở lại sẽ tự nhận diện người dùng.
- Backend trả về toàn bộ lịch sử hội thoại trước đó (lưu trong `conversations.json`) để frontend hiển thị lại.

### 2. Chat & xử lý vấn đề

- User mô tả vấn đề qua giao diện chat (ví dụ: "Tôi bị mất 500 gold sau khi update").
- Frontend gửi `POST /api/chat` với `{player_id, message}`.
- Backend gọi AI Agent:
  1. Tra cứu Knowledge Base (keyword matching trên `knowledge_base.json`).
  2. Tra cứu data người chơi trong `players.csv` dựa theo `player_id` để lấy context (gold hiện tại, username, ...).
  3. Gọi LLM API với prompt chứa KB context + player data.
  4. LLM trả về structured response: `{reply, confidence, db_changes}`.

### 3. Xử lý kết quả

- **Confidence > 0.8** (tình huống quen thuộc):
  - Backend tạo Mock PR: ghi vào `pending_reviews.json` với `before_value` và `after_value` từ CSV.
  - Trả về giao diện Diff cho đội CSKH review trên frontend (giống Git diff: giá trị cũ → giá trị mới).
  - Đội CSKH Approve → backend cập nhật `players.csv` → trả kết quả cho user.
  - Đội CSKH Reject → ghi log, không thay đổi gì.

- **Confidence ≤ 0.8** (tình huống mới):
  - Chuyển tiếp sang đội CSKH xử lý thủ công.
  - Ghi log case mới để sau này bổ sung vào Knowledge Base.

## Database: players.csv

File CSV đơn giản là DB chính, mỗi row là 1 player:

```csv
id,username,gold,level,status,last_login
P001,DragonSlayer,15000,45,active,2026-04-05
P002,ShadowNinja,8200,32,active,2026-04-04
P003,FireMage,0,28,banned,2026-03-20
```

AI Agent được phép **đọc** CSV để lấy thông tin player, và **đề xuất thay đổi** (ví dụ: hoàn gold), nhưng **không được ghi trực tiếp** — mọi thay đổi phải qua luồng Mock PR → CSKH Approve.

## API Endpoints

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/auth` | POST | Xác thực Player ID, set cookie, trả lịch sử chat |
| `/api/chat` | POST | Gửi tin nhắn, nhận AI response |
| `/api/pending-reviews` | GET | Lấy danh sách Mock PR chờ duyệt (cho CSKH) |
| `/api/resolve-pr` | POST | CSKH approve/reject một Mock PR |

## Quy tắc cho AI Agent (LLM Prompt)

Khi xây dựng prompt cho LLM, cần bao gồm:

1. **System role**: "Bạn là nhân viên CSKH của Falcon Game Studio. Bạn hỗ trợ người chơi giải quyết vấn đề liên quan đến tài khoản game."
2. **Player context**: Truyền thông tin player từ CSV (id, username, gold, level, status).
3. **Knowledge Base context**: Truyền các case tương tự đã match từ KB.
4. **Output format**: Yêu cầu LLM trả về JSON structured response.
5. **Giới hạn**: AI chỉ được đề xuất thay đổi, KHÔNG tự ý thực thi. Mọi thay đổi phải chờ CSKH duyệt.

## Công nghệ & Quy ước

- **Frontend**: React hoặc HTML/JS đơn giản (tùy Person A quyết định). Giao tiếp backend qua REST API.
- **Backend**: Node.js (Express) hoặc Python (FastAPI). Đọc/ghi CSV bằng thư viện csv-parser hoặc pandas.
- **AI Agent**: Gọi LLM API (OpenAI / Claude / Gemini). Knowledge Base là file JSON tĩnh.
- **Không dùng**: WebSocket, message queue, Docker, CI/CD, database server. Tất cả dùng file-based storage.

## Lệnh khởi chạy

- `npm run docs` — Khởi chạy trang tài liệu Docusaurus
- `npm run dev` — Khởi chạy đồng thời frontend + backend (sản phẩm cuối)
