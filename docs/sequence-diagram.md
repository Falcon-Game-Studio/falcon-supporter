---
sidebar_position: 3
title: Sequence Diagram
---

# Sequence Diagram - Tương tác giữa các thành phần

## Luồng xử lý tình huống đã biết (Auto-resolve)

```mermaid
sequenceDiagram
    actor User
    participant Page as Page/Chat UI
    participant Backend as Backend Server
    participant AI as AI Agent
    participant KB as Knowledge Base (JSON)
    participant CSKH as Đội CSKH
    participant DB as JSON DB

    User->>Page: Gửi tin nhắn mô tả vấn đề
    Page->>Backend: Forward tin nhắn (POST /api/chat)
    Backend->>AI: Gọi hàm phân tích
    AI->>KB: Tra cứu tình huống tương tự
    KB-->>AI: Trả về case tương tự (match)

    rect rgb(200, 230, 200)
        Note over AI,DB: Tình huống quen thuộc - Tạo Mock PR
        AI-->>Backend: Result {confidence: 0.9, db_changes}
        Backend->>DB: Lưu tạm Mock PR state
        Backend-->>Page: Trả về {status: "pending_review", diff: ...}
        
        Note over Page,CSKH: CSKH xem giao diện Diff trực tiếp trên web
        Page-->>User: "Đang chờ nhân viên duyệt yêu cầu thay đổi..."
        CSKH->>Page: Review Before/After -> Ấn Approve
        Page->>Backend: POST /api/resolve-pr {approve: true}
        Backend->>DB: Thực thi cập nhật giá trị mới
        Backend-->>Page: {status: "merged"}
        Page-->>User: "Yêu cầu đã được xử lý xong!"
    end

    rect rgb(200, 220, 240)
        Note over CSKH,KB: Feedback (Chỉ mang tính mô phỏng ở Hackathon)
        CSKH->>KB: Có thể hardcode thêm case mới vào file json sau
    end
```

## Luồng xử lý tình huống mới (Manual)

```mermaid
sequenceDiagram
    actor User
    participant Page as Page CSKH
    participant AI as AI Agent
    participant KB as Knowledge Base
    participant CSKH as Đội CSKH
    participant DB as Database

    User->>Page: Gửi tin nhắn mô tả vấn đề
    Page->>AI: Forward tin nhắn
    AI->>KB: Tra cứu tình huống tương tự
    KB-->>AI: Không tìm thấy (no match)

    rect rgb(255, 230, 200)
        Note over AI,CSKH: Tình huống mới - Chuyển đội CSKH
        AI->>CSKH: Đẩy sang hộp thư đội CSKH
        AI-->>Page: Thông báo đang chuyển tiếp
        Page-->>User: "Đang chuyển đến bộ phận hỗ trợ..."
        CSKH->>DB: Xử lý thủ công & cập nhật DB
        CSKH-->>Page: Phản hồi kết quả
        Page-->>User: Thông báo đã xử lý
    end

    rect rgb(200, 220, 240)
        Note over CSKH,KB: Feedback loop - AI học tập
        CSKH->>AI: Đẩy dữ liệu case mới đã resolve
        AI->>KB: Lưu vào Knowledge Base
        Note over KB: Case mới trở thành tình huống mẫu
    end
```
