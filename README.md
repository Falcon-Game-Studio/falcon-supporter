# Falcon Supporter

**Falcon Supporter** là hệ thống Chăm sóc Khách hàng (CSKH) AI thông minh dành cho Hackathon (1.5h). Dự án được viết tài liệu kết hợp trên nền tảng [Docusaurus](https://docusaurus.io/).

## Khởi chạy dự án (Hướng dẫn chính)

Góc nhìn tổng quan, bạn chỉ cần gõ 2 lệnh này ngay từ thư mục gốc của dự án:

### 1. Xem Tài liệu (`npm run docs`)
Khởi chạy tài liệu Docusaurus (Kanban Board, Sequence Diagram, Giới thiệu) ở local để theo dõi mô tả phân việc.

```bash
npm run docs
# hoặc: yarn docs
```

### 2. Khởi chạy Sản phẩm cuối (`npm run dev`)
Khởi chạy đồng thời giao diện Chat UI (Frontend) và server xử lý AI, tạo PR (Backend). 
Lệnh này sẽ gọi `npx concurrently` để chạy song song:

```bash
npm run dev
# hoặc: yarn dev
```

*Lưu ý: Mặc định `dev` đang trỏ vào `frontend/` và `backend/`, bạn hãy cập nhật lại script `dev:frontend` và `dev:backend` ở `package.json` cho khớp với folder chứa mã nguồn sản phẩm thực tế theo tùy người đảm nhận*.

## Installation

```bash
yarn
```

## Local Development (Tài liệu)

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build (Tài liệu)

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment (Tài liệu)

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
