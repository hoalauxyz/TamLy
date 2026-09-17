# Lắng — nền tảng hỗ trợ sức khỏe tinh thần cho người trẻ Việt Nam (MVP)

> **Lắng không chẩn đoán, không điều trị, không thay thế bác sĩ hay nhà tâm lý.**
> "An" trong app là AI, không phải người thật. Mọi bài sàng lọc chỉ để tham khảo.

Repo này là bản MVP kỹ thuật cho ý tưởng được phân tích trong [`docs/00-TONG-HOP-PHAN-TICH.md`](docs/00-TONG-HOP-PHAN-TICH.md).
**Sổ tay vận hành (ý tưởng, thuật toán, data, cách nâng cấp):** [`docs/01-VAN-HANH-VA-KY-THUAT.md`](docs/01-VAN-HANH-VA-KY-THUAT.md).
Định vị: **sàng lọc tham khảo + tự chăm sóc + kết nối con người**, ưu tiên an toàn hơn "thông minh".

## Cấu trúc

```
packages/core   Logic lõi, TypeScript thuần, không phụ thuộc runtime (101 test)
  src/safety      Phát hiện khủng hoảng (rule tiếng Việt + teencode + phủ định + người thứ ba), guard đầu ra LLM
  src/ai          Pipeline 7 bước cho "An", system prompt, intent, kịch bản không cần LLM, provider LLM trừu tượng
  src/screening   PHQ-9 / GAD-7 tiếng Việt, chấm điểm, câu chữ không chẩn đoán, cờ an toàn câu 9
  src/content     10 kỹ năng 2–5 phút (thở, grounding, CBT, BA, ngủ, nói với bố mẹ…)
  src/moderation  Tiền kiểm duyệt bài đăng nhóm (crisis / phương pháp / PII / spam / chẩn đoán người khác)
  src/crisis      Danh sách hotline + nội dung thẻ khẩn cấp

apps/api        Fastify + SQLite (node:sqlite). Check-in, sàng lọc, chat, nhóm, xuất/xóa dữ liệu, Safety Ops
apps/mobile     Expo (React Native) + Expo Router. Mở app = trò chuyện với An; tính năng khác trong menu ☰
```

## Chạy local

Yêu cầu: Node ≥ 22.12 (đã thử với 24), npm.

```bash
npm install

# 1. Test logic lõi
npm test

# 2. API (mặc định chạy chế độ không LLM — An trả lời bằng kịch bản)
cp apps/api/.env.example apps/api/.env      # sửa ADMIN_TOKEN; điền LLM_* nếu muốn bật AI
npm run api                                 # http://localhost:3000/health

# 3. App
npm run mobile:web                          # mở trong trình duyệt để xem nhanh
npm run mobile                              # Expo Go / emulator
```

Android emulator: client tự đổi `localhost` → `10.0.2.2`. Máy thật: sửa `expo.extra.apiBaseUrl` trong `apps/mobile/app.json` thành IP LAN của máy chạy API.

## Bật LLM

Trong `apps/api/.env` điền `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (tương thích OpenAI Chat Completions: OpenAI, Groq, Ollama local…).
LLM chỉ được gọi khi **đủ 4 điều kiện**: có cấu hình, `LLM_DISABLED=0`, người dùng đã bật "Cho phép An dùng AI", và (nếu có hạn mức) còn lượt trong ngày. `CHAT_DAILY_LIMIT=0` = không giới hạn.
Phát hiện khủng hoảng và guard đầu ra luôn chạy bất kể LLM có bật hay không.

## Nguyên tắc an toàn đã cài vào code

| Nguyên tắc | Ở đâu |
|---|---|
| Crisis chạy **trước** mọi thứ, không bị chặn bởi hạn mức | `apps/api/src/routes.ts` `/v1/chat`, `packages/core/src/ai/pipeline.ts` |
| Risk `high` → ngắt LLM, thẻ khẩn cấp cố định + hotline, log sự kiện | `pipeline.ts`, `crisis/resources.ts` |
| Đầu ra LLM bị chặn nếu chẩn đoán / kê thuốc / mô tả phương pháp / giả người thật | `safety/outputGuard.ts` |
| PHQ-9 câu 9 > 0 → cờ an toàn + hotline, ngay cả khi tổng điểm thấp | `screening/scoring.ts` |
| Bài nhóm có nội dung tự hại → **không đăng**, hỗ trợ tác giả, báo điều phối viên | `moderation/preModeration.ts` |
| Nhóm theo bối cảnh (thi cử, năm nhất…), không theo tên bệnh | `apps/api/src/db.ts` seed |
| Không lưu nguyên văn khi có crisis trừ khi `STORE_CRISIS_TEXT=1` | `db.logSafetyEvent` |
| Server không lưu nguyên văn hội thoại; học mẫu cảm xúc/chủ đề; người dùng xuất/xóa 1 nút | `/v1/chat`, `learn_events`, `/v1/me` |
| An luôn tự giới thiệu là AI | `ai/systemPrompt.ts`, `ai/scripts.ts` |

## Safety Ops (điều phối viên / cố vấn lâm sàng)

Header `x-admin-token: <ADMIN_TOKEN>`:

- `GET /v1/admin/safety-events?unreviewed=1` — sự kiện crisis / output bị chặn / bài bị giữ
- `POST /v1/admin/safety-events/:id/review` — đánh dấu đã xem
- `GET /v1/admin/posts/held`, `POST /v1/admin/posts/:id` — duyệt bài chờ
- `GET /v1/admin/metrics` — chỉ số 7 ngày

## Trước khi cho người dùng thật (bắt buộc)

- [ ] **Gọi xác minh từng hotline** trong `packages/core/src/crisis/resources.ts` và chuyển danh sách này lên cấu hình remote. Đường dây Ngày Mai đang đánh dấu `needs_verification`.
- [ ] Thay `x-user-id` bằng auth thật (OTP / Apple / Google) và tách bảng định danh khỏi bảng dữ liệu tâm lý.
- [ ] Chuyển SQLite → PostgreSQL; mã hóa at-rest; AsyncStorage → SecureStore/SQLCipher cho dữ liệu local.
- [ ] Có cố vấn lâm sàng review: câu chữ sàng lọc, kịch bản của An, ngưỡng crisis, quy trình Safety Ops.
- [ ] Red-team crisis detector với ≥ 300 câu thật (ẩn danh) từ nhóm mục tiêu; đo recall trước precision.
- [ ] Điều khoản, chính sách quyền riêng tư (PDPL 91/2025), xác nhận tuổi, kênh báo cáo.
- [ ] Người trực Safety Ops trong giờ mở nhóm; quy trình khi `crisisHigh7d` tăng bất thường.

## Scripts

| Lệnh | Việc |
|---|---|
| `npm test` | Test `@tamly/core` (node:test) |
| `npm run typecheck` | tsc cho core + api |
| `npx tsc --noEmit -p apps/mobile` | tsc cho mobile |
| `npm run api` | API dev (`--watch`) |
| `npm run mobile` / `npm run mobile:web` | Expo |
