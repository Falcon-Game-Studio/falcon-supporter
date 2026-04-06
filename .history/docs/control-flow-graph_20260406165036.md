---
sidebar_position: 2
title: Control Flow Graph
---

# Control Flow Graph - Quy trình CSKH với AI Agent

Sơ đồ dưới đây mô tả toàn bộ luồng xử lý từ khi **User gửi tin nhắn** đến khi vấn đề được giải quyết và AI Agent học hỏi.

## Tổng quan luồng xử lý

```mermaid
flowchart TD
    A["🧑 User gửi tin nhắn\nqua Page CSKH"]
    B["🤖 AI Agent nhận\nvà phân tích tin nhắn"]
    C{"🔍 AI tra cứu\nKnowledge Base"}
    D{"✅ Tìm thấy tình huống\ntương tự đã resolve?"}

    %% Nhánh đã từng gặp
    E["📝 AI tự động tạo\nPull Request sửa DB"]
    F["👨‍💼 Đội CSKH\nnhận PR để review"]
    G{"🔎 Đội CSKH\nduyệt PR?"}
    H["✅ Merge PR\nCập nhật DB"]
    I["❌ Reject PR\nGửi feedback cho AI"]

    %% Nhánh chưa từng gặp
    J["📨 Đẩy sang hộp thư\nĐội CSKH"]
    K["👨‍💼 Đội CSKH\nxử lý thủ công"]
    L{"🏁 Xử lý\nthành công?"}
    M["🔄 Tiếp tục xử lý\nhoặc escalate"]

    %% Phản hồi & Học tập
    N["💬 Phản hồi kết quả\ncho User"]
    O["📚 Đẩy dữ liệu case\ncho AI Agent học tập"]
    P["🧠 AI cập nhật\nKnowledge Base"]
    Q["🎯 Thêm vào bộ\ntình huống mẫu tham chiếu"]

    %% Flow chính
    A --> B
    B --> C
    C --> D

    %% Nhánh YES - đã từng gặp
    D -- "✅ Có - Tình huống quen thuộc" --> E
    E --> F
    F --> G
    G -- "✅ Approve" --> H
    H --> N
    G -- "❌ Reject" --> I
    I --> J

    %% Nhánh NO - chưa từng gặp
    D -- "❌ Không - Tình huống mới" --> J
    J --> K
    K --> L
    L -- "✅ Thành công" --> N
    L -- "❌ Chưa xong" --> M
    M --> K

    %% Feedback loop
    N --> O
    O --> P
    P --> Q
    Q -. "Tham chiếu cho\nlần xử lý tiếp" .-> C

    %% Styling
    style A fill:#4CAF50,stroke:#333,color:#fff
    style B fill:#2196F3,stroke:#333,color:#fff
    style C fill:#FF9800,stroke:#333,color:#fff
    style D fill:#FF9800,stroke:#333,color:#fff
    style E fill:#9C27B0,stroke:#333,color:#fff
    style F fill:#607D8B,stroke:#333,color:#fff
    style G fill:#FF9800,stroke:#333,color:#fff
    style H fill:#4CAF50,stroke:#333,color:#fff
    style I fill:#f44336,stroke:#333,color:#fff
    style J fill:#FF5722,stroke:#333,color:#fff
    style K fill:#607D8B,stroke:#333,color:#fff
    style L fill:#FF9800,stroke:#333,color:#fff
    style M fill:#795548,stroke:#333,color:#fff
    style N fill:#4CAF50,stroke:#333,color:#fff
    style O fill:#00BCD4,stroke:#333,color:#fff
    style P fill:#3F51B5,stroke:#333,color:#fff
    style Q fill:#8BC34A,stroke:#333,color:#fff
```

## Chi tiết từng bước

### 1. User gửi tin nhắn (A)
User truy cập **Page CSKH** và gửi tin nhắn mô tả vấn đề đang gặp phải.

### 2. AI Agent phân tích (B → C → D)
AI Agent nhận tin nhắn, sử dụng NLP để phân tích nội dung và tra cứu **Knowledge Base** — cơ sở dữ liệu các tình huống đã từng xử lý thành công.

### 3a. Tình huống quen thuộc (D → E → F → G)
Nếu AI phát hiện vấn đề **tương tự** một case đã resolve trước đó:
- AI **tự động tạo Pull Request** chứa các thay đổi DB cần thiết
- PR được gửi đến **đội CSKH** để review
- Nếu **Approve**: merge PR, cập nhật DB, phản hồi user
- Nếu **Reject**: chuyển sang xử lý thủ công (giống nhánh tình huống mới)

### 3b. Tình huống mới (D → J → K → L)
Nếu AI **không tìm thấy** tình huống tương tự:
- Tin nhắn được **đẩy sang hộp thư** đội CSKH
- Đội CSKH **xử lý thủ công**
- Nếu chưa xong, tiếp tục xử lý hoặc escalate

### 4. Feedback Loop - AI Học tập (N → O → P → Q)
Khi một case được xử lý thành công:
1. **Phản hồi** kết quả cho user
2. Đội CSKH **đẩy dữ liệu** case (vấn đề + giải pháp) cho AI Agent
3. AI **cập nhật Knowledge Base** với case mới
4. Case được thêm vào **bộ tình huống mẫu** để tham chiếu cho các lần xử lý tiếp theo

:::tip Vòng lặp cải tiến liên tục
Mỗi case được resolve thành công đều trở thành dữ liệu huấn luyện cho AI. Theo thời gian, AI sẽ tự động xử lý được nhiều tình huống hơn, giảm tải cho đội CSKH.
:::
