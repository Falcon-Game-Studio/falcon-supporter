---
sidebar_position: 4
title: Kanban Board
---

# Kanban Board - Phân chia công việc (Hackathon 1.5h)

:::tip Nguyên tắc tối giản
⏱️ **Chỉ có 1.5 giờ** — Mỗi người làm **3 task**, tổng **9 task**. Không WebSocket, không message queue, không CI/CD, không testing riêng. Chỉ REST API đơn giản, polling để cập nhật trạng thái.
:::

Dự án được chia thành **3 module độc lập**, mỗi người phụ trách 1 module. Các module giao tiếp qua API contract đã thống nhất trước.

## Tổng quan phân chia

```mermaid
graph LR
    A["👤 Person A<br/>Frontend - Chat UI & UI Review"] 
    B["👤 Person B<br/>AI Agent & Knowledge Base"]
    C["👤 Person C<br/>Backend & Giả lập PR"]

    A -- "REST API" --> C
    C -- "Function call" --> B
    B -- "Query" --> KB["📚 Knowledge Base<br/>(JSON file)"]
    C -- "Lưu Pending Request" --> DB["🗄️ JSON DB"]
    C -- "Trả kết quả Diff" --> A

    style A fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style C fill:#FF9800,color:#fff
```

---

<div class="kanban-container">

<div class="kanban-column kanban-green">

### 👤 Person A — Frontend (Chat UI)

<div class="kanban-section">

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>1. Chat UI cơ bản</strong>
<p>React component: ô nhập tin nhắn + danh sách messages. Hiển thị bubble user (phải) và AI (trái). Dùng state đơn giản, không cần phức tạp.</p>
<p><em>⏱️ ~40 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>2. Gọi REST API gửi/nhận tin nhắn</strong>
<p><code>POST /api/chat</code> gửi message, nhận response từ AI. Hiển thị loading spinner khi chờ. Xử lý error cơ bản (try-catch, hiển thị thông báo lỗi).</p>
<p><em>⏱️ ~25 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-frontend">Frontend</span>
<strong>3. Giao diện UI Review (Giả lập PR)</strong>
<p>Khi AI tự động resolve, hiển thị một giao diện giống như Git Diff để bộ phận CSKH review (Giả lập PR). Hiển thị giá trị DB DB <em>trước</em> và <em>sau</em> khi thay đổi, kèm nút Approve / Reject.</p>
<p><em>⏱️ ~25 phút</em></p>
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

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>1. Chuẩn bị Knowledge Base (JSON)</strong>
<p>Tạo file <code>knowledge_base.json</code> chứa 5-10 case mẫu. Mỗi case gồm: <code>keywords</code>, <code>problem</code>, <code>solution</code>, <code>db_changes</code>. Không cần vector DB — dùng keyword matching đơn giản.</p>
<p><em>⏱️ ~20 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>2. AI Agent xử lý tin nhắn</strong>
<p>Hàm <code>analyze_message(message)</code>: gọi LLM API (OpenAI/Claude) với prompt chứa context từ KB. Prompt yêu cầu LLM trả về JSON: <code>&#123;intent, matched_case, solution, confidence, db_changes&#125;</code>.</p>
<p><em>⏱️ ~40 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-ai">AI/ML</span>
<strong>3. Tra cứu KB + format kết quả</strong>
<p>Hàm <code>search_kb(message)</code>: tìm case tương tự bằng keyword matching. Truyền kết quả vào prompt LLM để AI đề xuất giải pháp chính xác hơn. Trả về structured response cho Backend.</p>
<p><em>⏱️ ~30 phút</em></p>
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

### 👤 Person C — Backend & Giả lập PR

<div class="kanban-section">

#### 🔨 To Do

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>1. REST API server</strong>
<p>Setup Express.js hoặc FastAPI. Một endpoint <code>POST /api/chat</code> xử lý nhận message và endpoint phụ để quản lý trạng thái Diff: <code>POST /api/resolve-pr</code>. CORS enabled.</p>
<p><em>⏱️ ~25 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>2. Xử lý logic Giả lập Pull Request</strong>
<p>Khi AI trả về <code>confidence > 0.8</code> + có <code>db_changes</code>: thay vì dùng GitHub API, backend record mock PR vào file JSON và trả <code>before_value</code>, <code>after_value</code> ngược lại cho Frontend để Frontend render giao diện Review.</p>
<p><em>⏱️ ~40 phút</em></p>
</div>

<div class="kanban-card">
<span class="kanban-tag tag-backend">Backend</span>
<strong>3. Xử lý case chuyển tiếp CSKH</strong>
<p>Khi AI trả về <code>confidence ≤ 0.8</code> hoặc không match KB: trả response "đã chuyển đội CSKH". Ghi log case mới vào file JSON (thay cho DB) để demo luồng fallback.</p>
<p><em>⏱️ ~25 phút</em></p>
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

## API Contract (Tối giản)

Chỉ cần **2 endpoint** cho Frontend ↔ Backend, và **1 function call** cho Backend → AI:

| Interface | From → To | Kiểu | Mô tả |
|---|---|---|---|
| `POST /api/chat` | Frontend → Backend | REST | Gửi message, nhận AI response + diff để review |
| `POST /api/resolve-pr` | Frontend → Backend | REST | Approve hoặc Reject giả lập PR |
| `analyze_message()` | Backend → AI Agent | Function call | Gọi trực tiếp (cùng server hoặc import module) |
| `search_kb()` | AI Agent → KB | Function call | Đọc file JSON, keyword matching |

```mermaid
sequenceDiagram
    participant A as Person A<br/>(Frontend Chat & Review)
    participant C as Person C<br/>(Backend)
    participant B as Person B<br/>(AI Agent)

    Note over A,B: Luồng đơn giản — REST API, đồng bộ

    A->>C: POST /api/chat {message}
    C->>B: analyze_message(message)
    B->>B: search_kb() → keyword match
    B->>B: Call LLM API với KB context
    B-->>C: {reply, confidence, db_changes}

    alt confidence > 0.8
        C->>C: Mock PR trên server
        C-->>A: {reply, status: "pending_review", diff: {before, after}}
        A-->>C: POST /api/resolve-pr {approve: true}
        C-->>A: {status: "merged"}
    else confidence ≤ 0.8
        C->>C: Log case → escalated.json
        C-->>A: {reply, status: "escalated"}
    end
```
