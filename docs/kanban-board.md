---
sidebar_position: 4
title: Kanban Board
---

# Kanban Board - Phân chia công việc

Dự án được chia thành **3 module độc lập**, mỗi người phụ trách 1 module. Các module giao tiếp qua API contract đã thống nhất trước.

## Tổng quan phân chia

```mermaid
graph LR
    A["👤 Person A<br/>Frontend - Chat UI"] 
    B["👤 Person B<br/>AI Agent & Knowledge Base"]
    C["👤 Person C<br/>Backend & PR Workflow"]

    A -- "REST API / WebSocket" --> C
    C -- "Internal API" --> B
    B -- "Query/Update" --> KB["📚 Knowledge Base"]
    C -- "GitHub API" --> PR["📝 Pull Request"]
    C -- "DB Access" --> DB["🗄️ Database"]

    style A fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style C fill:#FF9800,color:#fff
```

---

<div class="kanban-container">

<div class="kanban-column kanban-green">

### 👤 Person A — Frontend (Chat UI)

<div class="kanban-section">

#### 📋 Backlog

<div class="kanban-card">
<span class="kanban-tag tag-design">Design</span>
<strong>Thiết kế UI/UX cho trang Chat</strong>
<p>Wireframe + mockup giao diện chat giữa user và AI Agent. Responsive cho mobile & desktop.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-design">Design</span>
<strong>Thiết kế trang trạng thái xử lý</strong>
<p>UI hiển thị tiến trình xử lý ticket: đang xử lý, chờ review, đã hoàn thành.</p>
</div>

</div>

<div class="kanban-section">

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>Xây dựng Chat Component</strong>
<p>React component cho giao diện chat real-time. Hỗ trợ gửi/nhận tin nhắn, hiển thị typing indicator.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>Tích hợp WebSocket</strong>
<p>Kết nối WebSocket tới Backend để nhận/gửi message real-time. Xử lý reconnect & error states.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>Hiển thị trạng thái ticket</strong>
<p>Component hiển thị trạng thái xử lý: pending, in-progress, resolved. Polling hoặc subscribe qua WebSocket.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>Lịch sử hội thoại</strong>
<p>Trang hiển thị lịch sử các cuộc chat trước đó của user. Hỗ trợ tìm kiếm & lọc.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-test">Testing</span>
<strong>Unit test & E2E test cho Frontend</strong>
<p>Viết test cho các component chính. E2E test luồng chat hoàn chỉnh.</p>
</div>

</div>

<div class="kanban-section">

#### 🚀 In Progress

<p class="kanban-empty">Chưa có task nào đang thực hiện</p>

</div>

<div class="kanban-section">

#### ✅ Done

<p class="kanban-empty">Chưa có task nào hoàn thành</p>

</div>

</div>

<div class="kanban-column kanban-blue">

### 👤 Person B — AI Agent & Knowledge Base

<div class="kanban-section">

#### 📋 Backlog

<div class="kanban-card">
<span class="kanban-tag tag-research">Research</span>
<strong>Nghiên cứu LLM API phù hợp</strong>
<p>So sánh OpenAI GPT vs Claude API vs local model. Đánh giá cost, latency, accuracy cho use case CSKH.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-research">Research</span>
<strong>Thiết kế cấu trúc Knowledge Base</strong>
<p>Định nghĩa schema cho KB: categories, tags, embedding vectors, resolution steps. Chọn vector DB (Pinecone/Weaviate/ChromaDB).</p>
</div>

</div>

<div class="kanban-section">

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>Xây dựng AI Agent core</strong>
<p>Module xử lý tin nhắn user: intent classification, entity extraction, problem identification. Sử dụng LLM + prompt engineering.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>Xây dựng hệ thống tra cứu KB</strong>
<p>Semantic search trên Knowledge Base. Tìm case tương tự bằng embedding similarity. Trả về top-k matches + confidence score.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>Xây dựng module đề xuất giải pháp</strong>
<p>Dựa trên case tương tự từ KB, AI tự động generate giải pháp + DB change proposal. Output: structured JSON action plan.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>Learning loop - Cập nhật KB</strong>
<p>Module tự động học từ case đã resolve: extract pattern, update embeddings, thêm case mới vào KB.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-test">Testing</span>
<strong>Test AI accuracy & KB retrieval</strong>
<p>Benchmark AI agent với bộ test cases. Đo accuracy, recall, latency. Regression test khi update KB.</p>
</div>

</div>

<div class="kanban-section">

#### 🚀 In Progress

<p class="kanban-empty">Chưa có task nào đang thực hiện</p>

</div>

<div class="kanban-section">

#### ✅ Done

<p class="kanban-empty">Chưa có task nào hoàn thành</p>

</div>

</div>

<div class="kanban-column kanban-orange">

### 👤 Person C — Backend & PR Workflow

<div class="kanban-section">

#### 📋 Backlog

<div class="kanban-card">
<span class="kanban-tag tag-infra">Infra</span>
<strong>Thiết kế kiến trúc Backend</strong>
<p>System design: API gateway, message queue, service layer. Chọn tech stack (Node.js/Python FastAPI). Database schema design.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-infra">Infra</span>
<strong>Setup CI/CD & deployment</strong>
<p>GitHub Actions pipeline: build, test, deploy. Docker containerization. Staging & production environment.</p>
</div>

</div>

<div class="kanban-section">

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>API Gateway & WebSocket server</strong>
<p>REST API cho chat operations. WebSocket server cho real-time messaging. Authentication & rate limiting.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>Message queue & routing</strong>
<p>Queue system (Redis/RabbitMQ) để route messages giữa Frontend → AI Agent. Đảm bảo message ordering & delivery.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>Tự động tạo Pull Request</strong>
<p>Tích hợp GitHub API: tạo branch, commit DB changes, tạo PR. Template PR với description chi tiết từ AI analysis.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>PR webhook & merge handler</strong>
<p>Lắng nghe GitHub webhook khi PR approved/merged. Trigger DB update & thông báo result cho user qua WebSocket.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>Database operations layer</strong>
<p>Secure DB access layer: chỉ thực hiện changes sau khi PR merged. Audit log mọi thay đổi. Rollback mechanism.</p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-test">Testing</span>
<strong>Integration test & load test</strong>
<p>Test toàn bộ luồng end-to-end. Load test cho WebSocket connections & API throughput.</p>
</div>

</div>

<div class="kanban-section">

#### 🚀 In Progress

<p class="kanban-empty">Chưa có task nào đang thực hiện</p>

</div>

<div class="kanban-section">

#### ✅ Done

<p class="kanban-empty">Chưa có task nào hoàn thành</p>

</div>

</div>

</div>

---

## API Contract giữa các module

Để 3 người có thể làm việc độc lập, các API contract được định nghĩa trước:

| Interface | From | To | Protocol | Mô tả |
|---|---|---|---|---|
| Chat API | Person A | Person C | REST + WebSocket | Gửi/nhận tin nhắn, trạng thái ticket |
| AI Processing API | Person C | Person B | Internal REST | Forward message tới AI, nhận analysis result |
| KB Query API | Person B | Knowledge Base | Internal | Tra cứu & cập nhật Knowledge Base |
| GitHub PR API | Person C | GitHub | GitHub REST API | Tạo/quản lý Pull Request |
| Webhook Handler | GitHub | Person C | Webhook | Nhận event khi PR approved/merged |

```mermaid
sequenceDiagram
    participant A as Person A<br/>(Frontend)
    participant C as Person C<br/>(Backend)
    participant B as Person B<br/>(AI Agent)

    Note over A,B: Mỗi người dev độc lập, giao tiếp qua API contract

    A->>C: POST /api/chat/send {message}
    C->>B: POST /internal/ai/analyze {message, context}
    B-->>C: {intent, solution, confidence, db_changes}
    C-->>A: WebSocket: {status: "processing", ticket_id}
    C->>C: Create GitHub PR (if confidence > threshold)
    C-->>A: WebSocket: {status: "resolved", result}
```
