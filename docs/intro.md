---
sidebar_position: 1
title: Giới thiệu
---

# Falcon Supporter - Hệ thống CSKH thông minh

**Falcon Supporter** là hệ thống Chăm sóc Khách hàng (CSKH) tích hợp AI Agent, giúp tự động hóa quy trình xử lý yêu cầu của người dùng và học hỏi liên tục từ các tình huống đã giải quyết.

## Mục tiêu

- **Tự động hóa**: AI Agent tự động chat với user, nhận diện vấn đề và đề xuất giải pháp
- **Tự học**: AI liên tục học từ các case đã resolve để nâng cao khả năng xử lý
- **Giảm tải**: Giảm khối lượng công việc cho đội CSKH bằng cách tự động xử lý các tình huống quen thuộc
- **Kiểm soát**: Mọi thay đổi DB đều phải qua một giao diện "Mock Pull Request" trên màn hình Frontend thay vì GitHub thật, để đội CSKH review giá trị trước và sau khi thay đổi.

## Các thành phần chính

| Thành phần | Mô tả |
|---|---|
| **Page CSKH** | Giao diện chat để user gửi tin nhắn |
| **AI Agent** | Xử lý tin nhắn, phân tích vấn đề, đề xuất giải pháp |
| **Knowledge Base** | Cơ sở dữ liệu các tình huống mẫu đã resolve |
| **Đội CSKH** | Review thay đổi trên UI Diff, xử lý case mới |
