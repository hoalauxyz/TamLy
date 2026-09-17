# Tổng hợp phân tích: App hỗ trợ sức khỏe tinh thần cho người trẻ Việt Nam

*Cập nhật: 17/09/2026. Tài liệu này tổng hợp, kiểm chứng lại và bổ sung các đề xuất của Grok/Gemini mà bạn đã cung cấp. Những điểm tôi **không đồng ý** hoặc **điều chỉnh** so với hai bản đó được đánh dấu rõ.*

---

## 0. Trả lời ngắn cho từng câu hỏi của bạn

| Câu hỏi | Trả lời ngắn |
|---|---|
| Vấn đề SKTT giới trẻ VN có thật sự tăng và ít được quan tâm không? | **Có, có số liệu quốc gia.** V-NAMHS (khảo sát 5.996 hộ, 2021): 21,7% thanh thiếu niên 10–17 có vấn đề SKTT trong 12 tháng; chỉ **8,4%** trong số đó từng dùng dịch vụ hỗ trợ; chỉ 5,1% cha mẹ nhận ra con cần giúp. |
| Rào cản chính có phải stigma + chi phí? | **Đúng, nhưng chưa đủ.** Rào cản thứ ba lớn không kém: **thiếu nhân lực và không biết đi đâu** (chỉ ~50% người từng dùng dịch vụ quay lại lần 2). Thứ tư: **không có đường dây nóng quốc gia 24/7 cho người trưởng thành**. |
| Có nên làm app "phân tích, đánh giá mọi triệu chứng, đề xuất hướng điều trị"? | **Không, theo cách diễn đạt đó.** Về pháp lý (Luật Khám bệnh chữa bệnh 2023, Luật AI 2025) và an toàn, app **không được chẩn đoán/điều trị**. Nên làm app **sàng lọc – tự chăm sóc – kết nối** (triage + self-help + bridge). Đây là điều cả Grok và Gemini đều đúng. |
| Có nên có nhóm trò chuyện, kết nối người dùng? | **Có, nhưng đây là tính năng rủi ro cao nhất**, không phải chatbot. Chỉ nên làm dưới dạng **nhóm nhỏ có điều phối, tiền kiểm duyệt**, theo chủ đề tích cực, không theo tên bệnh. Không làm chat 1-1 giữa người lạ trong MVP. |
| VN đã có app tương tự chưa? | **Có ~8–10 sáng kiến** (VMood, Mindvivo, EchoMind, SafeNSound, Vietmind, BrainCare, các nền tảng đặt lịch…). Đa số nhỏ, pilot, hoặc thiếu bằng chứng. **Chưa có ai làm tốt đồng thời 3 trụ cột** với giá phù hợp sinh viên. |
| Thế giới thì sao? | Thị trường trưởng thành hơn nhưng vừa trải qua **bài học lớn**: Woebot (tiên phong, 1,5 triệu người dùng) **đóng cửa 30/6/2025** vì bế tắc pháp lý và mô hình kinh doanh; Character.AI/OpenAI bị kiện liên quan tự tử của thiếu niên (2025). Wysa, 7 Cups, Kooth, Togetherall là các mô hình đáng học. |
| Ý tưởng này khả thi không? | **Khả thi về nhu cầu và công nghệ; khó về mô hình kinh doanh, pháp lý và giữ chân người dùng.** Xem mục 7 (đánh giá trung lập) và mục 13 (điều kiện go/no-go). |
| Bạn (AI) có ý tưởng gì thêm? | Mục 8.3: 9 ý tưởng bổ sung, gồm cách định vị lại sản phẩm, mô hình phân phối qua trường/doanh nghiệp, và các quyết định kỹ thuật cụ thể. |

---

## 1. Hiện trạng Việt Nam: số liệu đã kiểm chứng

### 1.1 Quy mô nhu cầu

Nguồn tốt nhất hiện có là **V-NAMHS** (Viet Nam National Adolescent Mental Health Survey), do Viện Xã hội học, Johns Hopkins và ĐH Queensland thực hiện 2021, công bố 2023:

- **21,7%** thanh thiếu niên 10–17 tuổi có vấn đề SKTT trong 12 tháng qua (lo âu 18,6%, trầm cảm 4,3%).
- **3,3%** đủ tiêu chuẩn chẩn đoán rối loạn tâm thần (thấp hơn nhiều so với "vấn đề SKTT").
- Ý tưởng tự tử 12 tháng: **1,4%**; nhưng ở nhóm có rối loạn tâm thần, nguy cơ này cao gấp **14,7 lần**.
- Chỉ **8,4%** người có vấn đề đã tiếp cận dịch vụ hỗ trợ; **50,8%** trong số đó chỉ đi **một lần**.
- Chỉ **5,1%** cha mẹ nhận ra con cần hỗ trợ.

> **Điều chỉnh so với Grok:** Grok viết "khoảng 8% số người cần hỗ trợ". Chính xác là 8,4% *trong số người có vấn đề SKTT* (n=1.301), còn tỷ lệ dùng dịch vụ trên toàn bộ thanh thiếu niên là 6,5%. Ngoài ra V-NAMHS chỉ khảo sát 10–17 tuổi; **không có số liệu quốc gia tương đương cho nhóm 18–30** (sinh viên, người đi làm trẻ) — đây là khoảng trống dữ liệu mà chính dự án của bạn có thể góp phần lấp.

Số liệu về "tăng" theo thời gian: chưa có khảo sát lặp lại toàn quốc để khẳng định xu hướng tăng; các báo cáo ghi nhận tăng chủ yếu là số ca đến khám tại bệnh viện và số cuộc gọi tổng đài 111 (năm 2025: 616 cuộc gọi liên quan trẻ có vấn đề SKTT/ý định tự tử, 19 ca can thiệp trực tiếp). Cảm nhận "ngày càng nhiều" của bạn là hợp lý nhưng nên trình bày với nhà đầu tư là **"nhu cầu lớn và chưa được phục vụ"**, không phải "đang bùng nổ".

### 1.2 Rào cản chi phí (kiểm chứng 2025)

| Hình thức | Mức giá phổ biến |
|---|---|
| Khám tâm lý/tâm thần bệnh viện công | 150.000–300.000đ/lượt (nhưng thời gian ngắn, đông, stigma "vào viện tâm thần") |
| Tham vấn 1:1 phòng khám tư | 450.000–900.000đ/buổi 45–60 phút |
| Chuyên gia cấp cao / trị liệu chuyên sâu | 1.000.000–1.500.000đ/buổi; gói 10 buổi ~8.000.000đ |
| Online (Zoom/Meet) | 350.000–600.000đ/buổi |
| Ưu đãi sinh viên (một số nơi) | giảm 30–40% khi có thẻ SV |

So với thu nhập sinh viên (trợ cấp gia đình + làm thêm thường 3–6 triệu/tháng) và lương khởi điểm (8–12 triệu), một liệu trình 8–12 buổi (4–10 triệu) là **không khả thi cho đa số**. Đây là điểm mạnh nhất của ý tưởng app: **chi phí biên gần bằng 0 cho lớp hỗ trợ đầu tiên**.

### 1.3 Rào cản stigma và cách nó ảnh hưởng đến thiết kế

Stigma ở VN có 3 lớp, mỗi lớp cần một giải pháp thiết kế khác nhau:

| Lớp stigma | Biểu hiện | Hàm ý thiết kế |
|---|---|---|
| **Ngôn ngữ** | "tâm lý" = "tâm thần" = "khùng" | Không dùng từ *bệnh, rối loạn, điều trị, bệnh nhân* trong UI. Dùng *chăm sóc tinh thần, cân bằng, check-in, kỹ năng*. Không đặt tên nhóm theo bệnh. |
| **Xã hội/gia đình** | Sợ bố mẹ, bạn bè, nhà trường biết | Ẩn danh thật sự (không bắt tên thật), icon/tên app trung tính trên màn hình điện thoại, khóa app bằng PIN/FaceID, không gửi notification lộ nội dung. |
| **Tự kỳ thị** | "Mình chưa đến mức đó", "yếu đuối mới cần" | Định vị như **rèn luyện tinh thần** (mental fitness) cho mọi người, không phải công cụ cho "người có bệnh". Onboarding không bắt làm sàng lọc ngay (*khác Gemini*, xem 8.2). |

---

## 2. Hệ sinh thái Việt Nam hiện có (đã kiểm chứng 9/2026)

| Sản phẩm | Đơn vị | Mô hình | Trạng thái | Nhận xét |
|---|---|---|---|---|
| **VMood** | Viện PHAD + SFU (Canada), dự án IRIS-DSV | Sàng lọc trầm cảm + CBT tự quản lý có hỗ trợ (SSM) + nhân viên y tế cơ sở/CTXH | Pilot 2023–2025 tại 8 tỉnh; đến 8/2025 sàng lọc 3.366 người, 960 người nhận can thiệp | **Mô hình task-sharing đáng học nhất ở VN.** Nhưng là dự án tài trợ, không phải sản phẩm thương mại cho Gen Z; UX không cạnh tranh. |
| **Mindvivo** | Startup | Chatbot AI + test + đặt lịch chuyên gia (đa số thạc sĩ) | Đang hoạt động (web + app) | Đối thủ gần nhất. Tự tuyên bố **không xử lý khủng hoảng** — điểm yếu về an toàn có thể trở thành điểm khác biệt của bạn nếu bạn làm crisis protocol tốt. |
| **EchoMind** | 2 học sinh THPT Quảng Trị | Nhật ký cảm xúc + AI phản hồi, 13–25 tuổi | Miễn phí, thắng AI Hackathon TDF 2025 | Cho thấy rào cản kỹ thuật thấp; điểm khác biệt sẽ nằm ở **an toàn, bằng chứng, phân phối**, không ở "có AI". |
| **SafeNSound** | Startup | Đánh giá + AI + chuyên gia + nhẫn theo dõi sức khỏe | Hoạt động | Hướng hardware/wearable, tệp khách khác. |
| **Vietmind** | Startup | Chatbot + đặt lịch trị liệu | Hoạt động | Tương tự Mindvivo. |
| **Y-MIND / Y-PRIME** | Nghiên cứu học đường | Bài học kỹ năng sống cho HS THPT | *Không xác minh được nguồn công khai* (Grok nêu) | Coi là chưa có trên thị trường. |
| BrainCare, MoodCare, GenZ Mental Health, MoodTracker+ | Nhóm SV / dự án nhỏ | Sàng lọc online, tracker | Rời rạc | Không có moat. |
| BookingCare, các nền tảng đặt lịch | Marketplace y tế | Đặt lịch bác sĩ/chuyên gia | Hoạt động | Có thể là **đối tác** cho trụ cột "kết nối chuyên gia" thay vì tự xây. |
| ChatGPT, Gemini, Character.AI, Replika | Big tech | Chatbot đa dụng | Dùng tự phát rất phổ biến | **Đối thủ thực sự lớn nhất.** Miễn phí, thông minh hơn bất kỳ bot nội địa nào. Bạn không thắng bằng "thông minh hơn"; thắng bằng **an toàn hơn, riêng tư hơn, có con người thật phía sau, có lộ trình đi tiếp**. |

**Khoảng trống thị trường thực sự:** Không ai đang làm tốt đồng thời (a) UX dành cho Gen Z, (b) crisis protocol nghiêm túc, (c) cầu nối sang con người thật với giá 100.000–300.000đ, (d) phân phối qua trường học/doanh nghiệp, (e) có nghiên cứu bằng chứng đi kèm.

---

## 3. Thế giới: mô hình và bài học

### 3.1 Phân loại

| Nhóm | Ví dụ | Bằng chứng | Bài học cho VN |
|---|---|---|---|
| **AI chatbot CBT có cấu trúc** | **Wysa** (>30 nghiên cứu, FDA Breakthrough Device cho đau mạn tính), **Woebot** (RCT 2021 với SV, *đã đóng cửa 6/2025*), Youper, Earkick | Hiệu quả vừa phải với lo âu/trầm cảm nhẹ–trung bình, ngắn hạn | Kịch bản + LLM lai (hybrid) an toàn hơn LLM thuần. Woebot chết vì **không có đường thu tiền** khi vừa "wellness" vừa muốn "y tế". |
| **Dịch vụ text/chat với con người cho người trẻ** | **Kooth** (Anh, NHS trả tiền, 10–25 tuổi, ẩn danh, không cần giới thiệu), **ReachOut** (Úc) | Được hệ thống y tế công đặt hàng | **Mô hình B2G/B2B2C**: người dùng miễn phí, nhà nước/trường trả. Phù hợp VN nếu đi qua Sở GD, trường ĐH. |
| **Cộng đồng đồng đẳng có điều phối** | **Togetherall** (Anh, ẩn danh, điều phối 24/7 bởi chuyên viên lâm sàng), **7 Cups** (người lắng nghe tình nguyện được đào tạo) | Retention cao nhất trong các loại app SKTT | Peer support giữ chân người dùng tốt nhất **nhưng chỉ khi có điều phối chuyên nghiệp**. |
| **Trị liệu online** | BetterHelp, Talkspace | Tranh cãi về chất lượng, FTC phạt BetterHelp 7,8 triệu USD (2023) vì chia sẻ dữ liệu sức khỏe cho Facebook/Snapchat | Bán data = chết. Minh bạch dữ liệu là điều kiện sống. |
| **Mindfulness/wellness** | Headspace, Calm | Retention tốt hơn trung bình | Nội dung audio ngắn, ritual buổi tối. |
| **Bạn đồng hành AI** | Replika, Character.AI | Kiện tụng 2025 về tự tử thiếu niên | **Phản ví dụ.** Thiết kế tối đa hóa gắn bó cảm xúc với bot là nguy hiểm. |

### 3.2 Ba bài học quan trọng nhất

1. **Giữ chân người dùng là vấn đề số 1, không phải AI.** Nghiên cứu Baumel et al. (JMIR 2019) trên 93 app SKTT thực tế: **median retention ngày 15 là 3,9%, ngày 30 là 3,3%**. Ứng dụng peer support (8,9%), tracker/nhật ký (6,1%) và mindfulness (4,7%) giữ chân tốt hơn hẳn app hướng dẫn thở (0%).
   > **Điều chỉnh so với Gemini:** KPI "quay lại trong 7 ngày ≥ 35%" là **rất khó đạt**; D7 15–20% và D30 8–10% đã là **rất tốt** cho lĩnh vực này. Đặt KPI quá cao sẽ dẫn đến quyết định sai (ví dụ: thêm gamification gây nghiện).

2. **Định vị "wellness" hay "y tế" phải chọn dứt khoát ngay từ đầu.** Woebot kẹt ở giữa và chết. Với VN năm 2026, có thêm Luật AI và Luật BVDLCN mới, nên **chọn "wellness/hỗ trợ tinh thần" cho toàn bộ phần tự động**, và **chỉ phần chuyên gia (con người) mới được phép chạm đến "tham vấn"**.

3. **Sự cố an toàn = kết thúc dự án.** Một vụ việc kiểu Character.AI ở VN sẽ bị báo chí và cơ quan quản lý xử lý rất nặng. Crisis protocol không phải "tính năng P2" như Gemini xếp — **nó là điều kiện tiên quyết để có tính năng chat**.

---

## 4. Khung pháp lý Việt Nam 2026 (phần Grok/Gemini bỏ sót)

Ba văn bản trực tiếp chi phối sản phẩm này:

### 4.1 Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực 01/01/2026, thay Nghị định 13/2023)
- Dữ liệu sức khỏe/tâm lý là **dữ liệu nhạy cảm**: cần **đồng ý riêng, rõ ràng** cho từng mục đích; phải thông báo khi xử lý dữ liệu nhạy cảm.
- **Điều 26**: tổ chức phát triển ứng dụng về y tế phải tuân thủ đầy đủ; không cung cấp dữ liệu cho bên thứ ba là cơ sở y tế/bảo hiểm trừ khi có yêu cầu bằng văn bản của chủ thể.
- **Chuyển dữ liệu ra nước ngoài** (gọi API OpenAI/Anthropic/Google = chuyển dữ liệu xuyên biên giới): cần hồ sơ đánh giá tác động chuyển dữ liệu và đồng ý. → Hàm ý kỹ thuật ở mục 9.
- Quyền xóa, rút đồng ý, tiếp cận dữ liệu phải có sẵn trong app.
- Nghị định 356/2025/NĐ-CP hướng dẫn thi hành, cùng hiệu lực.

### 4.2 Luật Trí tuệ nhân tạo số 134/2025/QH15 (hiệu lực 01/03/2026) + Nghị định 142/2026/NĐ-CP (01/05/2026)
- Nhà cung cấp phải **tự phân loại rủi ro** (cao/trung bình/thấp) **trước khi đưa vào sử dụng**.
- **Điều 9**: hệ thống "có khả năng gây nhầm lẫn do người dùng không nhận biết đang tương tác với AI" là **rủi ro trung bình** → chatbot của bạn **tối thiểu là rủi ro trung bình** → phải **thông báo phân loại cho Bộ KH&CN** qua cổng một cửa AI.
- Hệ thống "có thể gây thiệt hại đáng kể đến tính mạng, sức khỏe" là **rủi ro cao**; lĩnh vực y tế được nêu đích danh. Chatbot SKTT có thể bị xếp rủi ro cao tùy Danh mục do Thủ tướng ban hành → cần **đánh giá sự phù hợp** (tự đánh giá hoặc qua tổ chức) trước khi vận hành.
- **Điều 11**: bắt buộc cho người dùng biết đang nói chuyện với AI.
- **Điều 14** (nếu rủi ro cao): quản lý rủi ro, hồ sơ kỹ thuật + nhật ký hoạt động, **thiết kế cho phép con người giám sát và can thiệp**, xử lý sự cố, giải trình.
- Trách nhiệm bồi thường: bên triển khai chịu trách nhiệm trước, kể cả khi vận hành đúng quy định.

> **Khuyến nghị:** Thiết kế hệ thống **như thể nó là rủi ro cao** ngay từ MVP (audit log, human-in-the-loop, incident process) — chi phí thêm nhỏ, còn làm lại sau thì rất đắt. Cần luật sư xác nhận phân loại trước khi ra mắt công khai.

### 4.3 Luật Khám bệnh, chữa bệnh số 15/2023/QH15 (hiệu lực 01/01/2024) + Nghị định 96/2023
- **"Tâm lý lâm sàng" là chức danh phải có giấy phép hành nghề** (có hiệu lực cấp phép từ 2024; kiểm tra năng lực từ 2029).
- "Khám bệnh, chữa bệnh từ xa" là hoạt động có điều kiện của cơ sở KCB.
- Hàm ý: (a) App **không** được mô tả là "chẩn đoán/điều trị"; (b) Marketplace chuyên gia phải phân biệt rõ **tham vấn tâm lý (không phải KCB)** với **trị liệu lâm sàng (cần giấy phép + cơ sở)**; (c) Nên xác minh giấy phép hành nghề/bằng cấp của từng chuyên gia và hiển thị công khai.

### 4.4 Các quy định liên quan khác
- Người dùng dưới 16 tuổi: Luật Trẻ em 2016, cần cơ chế đồng ý của cha mẹ theo PDPL → **MVP nên giới hạn 16+ hoặc 18+** để tránh phức tạp; mở rộng xuống THPT sau khi có đối tác trường học.
- Nội dung số/mạng xã hội: nếu có nhóm cộng đồng, có thể rơi vào phạm vi Nghị định 147/2024 về quản lý mạng xã hội (xác thực tài khoản bằng SĐT). Cần luật sư rà.

Chi tiết checklist: xem `01-PHAP-LY-VA-AN-TOAN.md`.

---

## 5. Hai câu hỏi cốt lõi của bạn, trả lời thẳng

### "Có nên làm app phân tích, đánh giá mọi triệu chứng, đề xuất hướng điều trị?"

**Không nên theo nghĩa đen**, vì ba lý do:
1. **Pháp lý**: "đánh giá triệu chứng + đề xuất điều trị" = hành vi khám chữa bệnh → cần giấy phép, cơ sở KCB, và AI sẽ là rủi ro cao chắc chắn.
2. **Khoa học**: Không có công cụ tự động nào (kể cả PHQ-9/GAD-7) đủ độ đặc hiệu để "đánh giá mọi triệu chứng". Chúng chỉ là **sàng lọc** (screening), tỷ lệ dương tính giả cao.
3. **Thương mại**: Woebot đã chứng minh con đường "y tế số" quá dài và đắt cho startup.

**Nên làm:** *Sàng lọc có kiểm chứng (PHQ-9, GAD-7 bản Việt) → phản hồi bằng ngôn ngữ không chẩn đoán → gợi ý bước tiếp theo phù hợp mức độ (tự chăm sóc / nói chuyện với người hỗ trợ / gặp chuyên gia / hotline khẩn cấp).* Đây là **triage**, không phải chẩn đoán, và hoàn toàn hợp lệ.

### "Có nên lập nhóm trò chuyện, kết nối những người này với nhau?"

**Nên, nhưng đây là nơi rủi ro cao hơn chatbot**, vì:
- Hiệu ứng lây lan (contagion): người có ý định tự hại nói chuyện với nhau mà không có điều phối → nguy hiểm đã được ghi nhận trong nghiên cứu về diễn đàn tự hại.
- Kiểm duyệt tiếng Việt Gen Z (teencode, ẩn dụ, viết không dấu) rất khó với công cụ tự động hiện có.
- Chi phí điều phối bởi con người là chi phí vận hành lớn nhất và không giảm theo quy mô.

**Cách làm an toàn (xem 8.2):** nhóm nhỏ 6–12 người theo chủ đề tích cực, **tiền kiểm duyệt** (bài đăng qua bộ lọc trước khi hiện), điều phối viên là sinh viên tâm lý năm cuối có giám sát (mô hình 7 Cups + hợp tác khoa Tâm lý), không có chat riêng 1-1 trong MVP, có "giờ mở cửa" thay vì 24/7.

---

## 6. Ba trụ cột sản phẩm (đồng thuận với Grok/Gemini, có điều chỉnh)

```
        ┌──────────────────────────────────────────────────┐
        │  TRỤ CỘT 1: HIỂU MÌNH                            │
        │  Check-in 30s hằng ngày · Nhật ký · Sàng lọc     │
        │  PHQ-9/GAD-7 · Biểu đồ xu hướng                   │
        └───────────────────────┬──────────────────────────┘
                                │ dữ liệu cá nhân (local-first)
        ┌───────────────────────▼──────────────────────────┐
        │  TRỤ CỘT 2: TỰ CHĂM SÓC NGAY                     │
        │  Bạn đồng hành "An" (AI, có guardrail) ·         │
        │  Thư viện kỹ năng CBT/ACT 2–5 phút · Audio        │
        └───────────────────────┬──────────────────────────┘
                                │ khi cần con người
        ┌───────────────────────▼──────────────────────────┐
        │  TRỤ CỘT 3: KẾT NỐI CON NGƯỜI                    │
        │  Nhóm nhỏ có điều phối · Chuyên gia giá phù hợp  │
        │  · Hotline/khẩn cấp (luôn hiện)                   │
        └──────────────────────────────────────────────────┘
        ════════════ LỚP AN TOÀN XUYÊN SUỐT ═══════════════
        Crisis detection · Pre-moderation · Audit log ·
        Human oversight · Privacy by design
```

---

## 7. Đánh giá trung lập về tính khả thi

### 7.1 Điểm cộng (có căn cứ)
- Nhu cầu chưa được phục vụ là **thật và lớn** (91,6% người có vấn đề chưa dùng dịch vụ).
- Chi phí biên của lớp hỗ trợ đầu tiên gần 0; giá chuyên gia có thể giảm 50–70% qua online + task-sharing.
- Gen Z VN đã quen dùng chatbot; **ChatGPT đang làm thay việc giáo dục thị trường** cho bạn.
- Nhà nước đang quan tâm (Chiến lược quốc gia về SKTT, Luật AI có cơ chế sandbox và Quỹ hỗ trợ).
- Chưa có người thắng rõ ràng ở VN.

### 7.2 Điểm trừ (có căn cứ)
- **Giữ chân người dùng cực khó** (median D30 = 3,3% toàn ngành).
- **Người dùng mục tiêu không có tiền** → doanh thu phải đến từ B2B/B2G, vốn bán rất chậm ở VN (chu kỳ 6–18 tháng với trường/sở).
- **Ba luật mới cùng có hiệu lực 2026** làm tăng chi phí tuân thủ ngay từ đầu.
- **Chi phí vận hành con người** (điều phối viên, chuyên gia trực ca, review sự cố) không giảm theo quy mô.
- **Cạnh tranh với miễn phí** (ChatGPT) ở phần "nói chuyện với AI".
- **Thiếu nhân lực**: cả nước có rất ít nhà tâm lý lâm sàng được cấp phép; marketplace có thể "trống hàng".

### 7.3 Kết luận trung lập
Xác suất thành công như **một sản phẩm tiêu dùng độc lập thu phí người dùng cuối: thấp** (<15%, tham chiếu tỷ lệ sống của app SKTT toàn cầu).
Xác suất tạo tác động và tự nuôi được **như một nền tảng B2B2C đi qua trường đại học/doanh nghiệp, có đối tác học thuật và có bằng chứng: trung bình** (30–40%), với điều kiện đội ngũ có ít nhất một người có chuyên môn lâm sàng và một người bán được cho tổ chức.
Xác suất gây hại nếu làm nhanh, bỏ qua crisis protocol và pháp lý: **cao** — và đó là rủi ro không thể sửa bằng phiên bản sau.

**→ Đáng làm, nhưng làm như một dự án y tế công cộng có kỷ luật kỹ thuật, không như một app startup "move fast".**

---

## 8. Đề xuất sản phẩm

### 8.1 Định vị
- **Tên gợi ý:** trung tính, không "tâm lý/tâm thần" trong tên (ví dụ *Lắng*, *An*, *Nhẹ*, *Thở*). Icon không gợi y tế.
- **Một câu:** "Chỗ để bạn kiểm tra tinh thần mỗi ngày, có công cụ để tự cân bằng, và có người thật khi bạn cần."
- **Không bao giờ nói:** chẩn đoán, điều trị, bệnh, bệnh nhân, chữa lành (từ "chữa lành" đã bị lạm dụng và mang nghĩa mỉa mai với Gen Z 2025–2026).

### 8.2 Tính năng MVP (điều chỉnh so với Gemini)

| Ưu tiên | Tính năng | Khác gì với đề xuất Gemini |
|---|---|---|
| **P0** | **Lớp an toàn**: crisis detection 2 lớp, màn hình khẩn cấp, hotline luôn hiện, audit log, kill-switch tắt chat | Gemini xếp hotline ở P2. Tôi xếp **P0, làm trước cả chatbot**. |
| **P0** | **Check-in 30 giây** (emoji + 1 từ + 1 slider) — vòng lặp thói quen cốt lõi, có widget/notification tối | Gemini gọi là Mood Journal; tôi tách "check-in siêu ngắn" (hằng ngày) khỏi "nhật ký" (tùy chọn) vì retention phụ thuộc vào cái đầu. |
| **P0** | **Sàng lọc PHQ-9 + GAD-7** đầy đủ (không rút gọn), tần suất 2 tuần, kết quả bằng ngôn ngữ mức độ + bước tiếp theo | Gemini đề xuất bản rút gọn và bắt buộc lúc onboarding. Tôi **không bắt buộc lúc onboarding** (gây bỏ cuộc và stigma) — gợi ý sau check-in thứ 3. Dùng bản đầy đủ vì đã được chuẩn hóa tiếng Việt và câu 9 PHQ-9 là điểm kích hoạt crisis quan trọng. |
| **P0** | **Bạn đồng hành "An"** (AI hybrid): kịch bản kỹ năng cố định + LLM cho đồng cảm, giới hạn 20 tin/ngày miễn phí, luôn hiện "An là AI" | Thêm: **chế độ không-LLM** (chỉ kịch bản) làm fallback khi API lỗi/quá tải hoặc khi cần tắt khẩn cấp. |
| **P0** | **Thư viện kỹ năng** 10 bài 2–5 phút (thở 4-7-8, box breathing, grounding 5-4-3-2-1, ghi lại suy nghĩ, kích hoạt hành vi, vệ sinh giấc ngủ, giới hạn mạng xã hội, lòng biết ơn, chấp nhận cảm xúc, chuẩn bị nói chuyện với người thân) | Đồng thuận. Bổ sung bài "**Nói với bố mẹ như thế nào**" — nhu cầu rất VN. |
| **P1** | **Nhóm nhỏ có điều phối** (6–12 người/nhóm, theo chủ đề: áp lực thi cử, năm nhất xa nhà, đi làm năm đầu, mất phương hướng sau tốt nghiệp), tiền kiểm duyệt, giờ mở cửa | Gemini đề xuất feed công khai kiểu mạng xã hội. Tôi đề xuất **nhóm kín, nhỏ, có giờ**, vì an toàn và vì Togetherall/7 Cups cho thấy điều phối là thứ giữ chân. |
| **P1** | **Kết nối người hỗ trợ** 2 tầng: (a) *người lắng nghe được đào tạo* (SV tâm lý năm cuối có giám sát, 30 phút, 50.000–100.000đ hoặc miễn phí qua trường); (b) *chuyên gia có xác minh* (200.000–400.000đ) | Gemini chỉ có tầng chuyên gia. Tầng (a) là **cách duy nhất** để giá xuống mức sinh viên trả được; cần khung pháp lý "lắng nghe/đồng hành", không phải "tham vấn". |
| **P2** | Xuất báo cáo cho buổi gặp chuyên gia (biểu đồ + kết quả sàng lọc, do người dùng chủ động chia sẻ) | Mới. Giúp buổi 30 phút hiệu quả hơn, tạo giá trị cho cả chuyên gia. |
| **P2** | Chế độ "Người bên cạnh" cho bạn bè/gia đình: cách nhận ra dấu hiệu, cách nói chuyện, hotline | Mới. Đánh vào 5,1% cha mẹ nhận ra con cần giúp; giảm stigma từ phía người thân. |
| **Loại khỏi MVP** | Gamification streak/điểm, wearable, chat 1-1 giữa người dùng, video call trong app (dùng Google Meet/Zoom link), đa ngôn ngữ, AI "phân tích nhật ký sâu" | Đồng thuận với Gemini, thêm loại chat 1-1 người lạ. |

### 8.3 Chín ý tưởng bổ sung của tôi

1. **Đi qua trường học, không đi qua App Store.** Phòng tâm lý học đường theo Thông tư 31/2017 tồn tại trên giấy ở hầu hết trường nhưng thiếu nhân lực. Đề xuất gói "trường trả 20–50 triệu/năm, toàn bộ SV dùng miễn phí + 1 điều phối viên bán thời gian". Bán cho 10 trường ĐH = đủ nuôi MVP. Đây là mô hình Kooth.
2. **Local-first cho dữ liệu nhạy cảm nhất.** Nhật ký và check-in lưu **trên máy** (mã hóa SQLite), chỉ đồng bộ nếu người dùng bật. Chat với AI bắt buộc qua server nhưng chỉ gửi nội dung + pseudonymous ID, không gửi hồ sơ. Giảm bề mặt rủi ro PDPL và tăng niềm tin.
3. **Chatbot là "cửa vào", không phải "điểm đến".** Thiết kế cố ý để An **dẫn người dùng ra khỏi chat** — sang bài kỹ năng, sang check-in, sang con người — sau 5–8 lượt. Ngược hoàn toàn với Replika. Đo KPI "tỷ lệ chuyển ra ngoài chat" thay vì "thời gian trong chat".
4. **Kịch bản trước, LLM sau.** 60–70% lượt tương tác hữu ích (hướng dẫn thở, grounding, ghi suy nghĩ) làm được bằng kịch bản có nhánh, không cần LLM → rẻ, an toàn, kiểm định được. LLM chỉ dùng cho phần phản ánh cảm xúc và chọn kịch bản.
5. **Hợp tác khoa Tâm lý ngay từ tháng 1** (ĐH KHXH&NV Hà Nội/TP.HCM, ĐH Sư phạm, ĐH Giáo dục – ĐHQGHN) với 3 vai: cố vấn lâm sàng, nguồn điều phối viên/người lắng nghe (thực tập có tín chỉ), và nghiên cứu pre-post để có bằng chứng. Bằng chứng là thứ mở cửa Sở GD và nhà tài trợ.
6. **Đường dây nóng là cấu hình từ xa, không hardcode.** Hotline Ngày Mai (096 306 1414) có dấu hiệu tạm dừng kênh online từ 1/1/2026; nếu hardcode một số không còn hoạt động vào màn hình khẩn cấp, đó là lỗi chết người. Danh sách hotline phải tải từ server, có `verifiedAt`, và có quy trình gọi kiểm tra hằng tháng.
7. **Tự tạo bộ dữ liệu crisis tiếng Việt Gen Z.** Không có bộ dữ liệu công khai nào cho teencode/ẩn dụ tự hại tiếng Việt ("muốn biến mất", "ngủ luôn không dậy", "bay màu", "kb sống để làm gì"). Bắt đầu bằng danh sách luật + đánh giá của chuyên gia, sau đó dùng log đã ẩn danh (có đồng ý) để xây classifier riêng. Đây là **moat kỹ thuật thật** của dự án.
8. **Bảng điều khiển an toàn (Safety Ops)** cho nhóm vận hành: sự kiện crisis theo thời gian thực, bài chờ duyệt, bot output bị guard chặn, nút tắt LLM toàn hệ thống. Luật AI Điều 14(d) yêu cầu đúng thứ này.
9. **Mô hình tài chính "tam giác"**: trường/doanh nghiệp trả (60%), người dùng premium tự nguyện trả 49.000–79.000đ/tháng cho tầng "người lắng nghe" (20%), tài trợ/nghiên cứu (20%). Không kỳ vọng doanh thu từ sinh viên năm 1.

---

## 9. Logic dữ liệu và AI (tóm tắt; chi tiết ở `02-KIEN-TRUC-KY-THUAT.md`)

### 9.1 Nguyên tắc dữ liệu
1. **Tách định danh khỏi nội dung**: bảng `auth` (SĐT/email, hash) tách vật lý khỏi bảng `profiles` (pseudonymous `user_id`), khóa liên kết được mã hóa.
2. **Tối thiểu hóa**: không hỏi tên thật, trường, địa chỉ. Tuổi chỉ hỏi "≥16?".
3. **Mã hóa**: at-rest (DB) + in-transit (TLS); nhật ký local mã hóa bằng khóa trong Secure Enclave/Keystore.
4. **Đồng ý theo lớp**: (a) dùng app; (b) gửi nội dung chat đến nhà cung cấp LLM (nêu tên, nêu nước); (c) dùng dữ liệu ẩn danh cho nghiên cứu; (d) chia sẻ báo cáo với chuyên gia. Mỗi lớp bật/tắt riêng.
5. **Vòng đời**: chat tự xóa sau 30 ngày mặc định; xóa tài khoản hoàn tất ≤30 ngày; xuất dữ liệu 1 chạm.
6. **Log crisis**: lưu *sự kiện* (thời gian, mức, hành động đã hiện), không lưu nguyên văn trừ khi cần cho review có kiểm soát truy cập.
7. **Không train model công khai** trên dữ liệu người dùng. Dữ liệu nghiên cứu phải qua khử nhận dạng và phê duyệt đạo đức.

### 9.2 Luồng AI 7 bước (đồng thuận với Grok, có bổ sung)
```
Input → [1] Chuẩn hóa (bỏ dấu, teencode → chuẩn)
      → [2] CRISIS RULES (regex có trọng số, <5ms) ──high──▶ Màn hình khẩn cấp, dừng LLM
      → [3] CRISIS CLASSIFIER (LLM nhỏ, JSON) ──medium──▶ An hỏi xác nhận nhẹ, gắn cờ
      → [4] Phân loại ý định + cảm xúc (JSON)
      → [5] Chọn chiến lược: KỊCH BẢN (60–70%) | LLM đồng cảm (30–40%)
      → [6] OUTPUT GUARD: chặn chẩn đoán, thuốc, chi tiết phương pháp tự hại, hứa hẹn
      → [7] Trả lời + ghi log (intent, emotion, risk, guard_hits, prompt_version)
```
Bổ sung so với Grok: bước 5 ưu tiên kịch bản; bước 6 có danh sách chặn cụ thể; **toàn bộ pipeline phải chạy được ở chế độ "no-LLM"**.

### 9.3 Lựa chọn mô hình
- **MVP:** LLM thương mại qua API (GPT-4o-mini / Claude Haiku / Gemini Flash) với hợp đồng xử lý dữ liệu, gửi pseudonymous, không lưu phía nhà cung cấp (zero-retention). Phải lập hồ sơ chuyển dữ liệu xuyên biên giới theo PDPL.
- **Giai đoạn 2:** đánh giá mô hình mã nguồn mở tiếng Việt (Qwen/Llama fine-tune, Vistral, PhoGPT) host tại VN (FPT/Viettel/VNG Cloud) để bỏ vấn đề xuyên biên giới và giảm chi phí khi >50k người dùng.
- Classifier crisis: bắt đầu bằng luật + LLM nhỏ; sau 3–6 tháng có ~2.000 mẫu đã gán nhãn → train PhoBERT/ViSoBERT nhỏ chạy nội bộ.

---

## 10. Mô hình kinh doanh và chi phí ước tính

### 10.1 Nguồn thu (theo thứ tự thực tế)
1. **B2B2C trường đại học**: 20–50 triệu/trường/năm (tùy quy mô), người dùng miễn phí. Mục tiêu năm 1: 5–10 trường.
2. **B2B doanh nghiệp** (EAP cho nhân viên trẻ): 30.000–60.000đ/nhân viên/năm.
3. **Premium cá nhân**: 49.000–79.000đ/tháng: không giới hạn chat, 1 buổi người lắng nghe/tháng.
4. **Hoa hồng chuyên gia**: 15–20% trên mỗi buổi (chỉ khả thi khi có khối lượng).
5. **Tài trợ/nghiên cứu**: UNICEF, WHO, Grand Challenges Canada, quỹ ESG doanh nghiệp, Quỹ phát triển AI (Luật AI Điều 23).

### 10.2 Chi phí MVP (ước tính, VN, 2026)
| Hạng mục | 4 tháng MVP | Vận hành/tháng sau launch |
|---|---|---|
| Đội ngũ (2 dev, 1 designer/PM, 1 cố vấn lâm sàng bán thời gian) | 400–600 triệu | 120–180 triệu |
| Hạ tầng cloud + LLM API (5.000 người dùng, 20 tin/ngày, 30% dùng) | 10–20 triệu | 15–40 triệu |
| Pháp lý (PDPL, Luật AI, ToS, hợp đồng chuyên gia) | 50–100 triệu | 5–10 triệu |
| Điều phối viên/người lắng nghe (4–6 SV bán thời gian có giám sát) | — | 30–60 triệu |
| Nội dung (10 bài, audio, minh họa) | 30–60 triệu | 10 triệu |
| **Tổng** | **~500–800 triệu** | **~180–300 triệu/tháng** |

→ Cần **~1,5–2,5 tỷ đồng** để đi đến điểm có thể chứng minh với 3–5 trường và ~5.000 người dùng thật (12 tháng). Đây là quy mô pre-seed/grant, không phải "tự làm cuối tuần".

---

## 11. Lộ trình 12 tháng

| Giai đoạn | Thời gian | Kết quả cần có |
|---|---|---|
| **0. Nền tảng** | Tháng 1 | Cố vấn lâm sàng ký kết; luật sư rà 3 luật; chọn tên/định vị; Việt hóa & kiểm tra PHQ-9/GAD-7; danh sách crisis v1 có chuyên gia duyệt; hợp tác 1 khoa Tâm lý |
| **1. MVP kỹ thuật** | Tháng 2–4 | Check-in, sàng lọc, An (hybrid), 10 bài kỹ năng, màn hình khẩn cấp, Safety Ops dashboard, red-team 200 kịch bản crisis |
| **2. Closed beta** | Tháng 5–6 | 200–300 SV tại 1–2 trường đối tác; đo D7/D30, tỷ lệ chuyển ra ngoài chat, precision/recall crisis; sửa |
| **3. Nhóm + người lắng nghe** | Tháng 7–9 | 4 nhóm chủ đề có điều phối; 6 người lắng nghe được đào tạo 40 giờ; 3 chuyên gia xác minh; thông báo phân loại AI cho Bộ KH&CN |
| **4. Mở rộng có kiểm soát** | Tháng 10–12 | 5 trường, ~5.000 người dùng; báo cáo pre-post đầu tiên; hồ sơ xin tài trợ; quyết định go/no-go vòng tiếp |

---

## 12. Rủi ro và giảm thiểu

| Rủi ro | Xác suất | Tác động | Giảm thiểu |
|---|---|---|---|
| Sự cố người dùng tự hại sau khi dùng app, báo chí đưa tin | Thấp–TB | **Chết dự án** | Crisis protocol P0; red-team; cố vấn lâm sàng review ca; disclaimer; bảo hiểm trách nhiệm; quy trình xử lý sự cố theo Luật AI Điều 12 |
| Retention thấp (D30 < 3%) | **Cao** | Không có gì để bán | Check-in 30s làm lõi; notification tối 21h; nhóm có điều phối; đo và sửa hằng tuần trong beta |
| Không bán được cho trường trong 12 tháng | Cao | Hết tiền | Bắt đầu bán từ tháng 1 (không đợi MVP), pilot miễn phí đổi lấy dữ liệu + thư giới thiệu; tìm grant song song |
| Bị phân loại AI rủi ro cao, cần đánh giá sự phù hợp tốn kém | TB | Trì hoãn 3–6 tháng | Thiết kế theo chuẩn rủi ro cao từ đầu; hỏi Bộ KH&CN qua sandbox (Điều 22) |
| Rò rỉ dữ liệu | Thấp | Rất nặng (PDPL + mất niềm tin) | Local-first, tách định danh, pentest trước launch, không lưu chat >30 ngày |
| Nhóm cộng đồng toxic/lây lan | TB | Nặng | Tiền kiểm duyệt, nhóm nhỏ, giờ mở cửa, điều phối viên có giám sát, quy tắc 5 điểm |
| LLM provider đổi giá/chính sách | TB | Chi phí | Provider abstraction; chế độ no-LLM; kế hoạch host nội địa |
| Thiếu chuyên gia có giấy phép | Cao | Marketplace trống | Tầng "người lắng nghe"; hợp tác phòng khám hiện có thay vì tuyển lẻ |

---

## 13. Điều kiện go/no-go (đề nghị bạn tự kiểm trước khi đầu tư lớn)

**GO nếu có đủ 4/5:**
1. Có ít nhất một cố vấn lâm sàng (BS tâm thần hoặc nhà tâm lý lâm sàng có giấy phép) đồng ý tham gia từ đầu.
2. Có một trường ĐH/khoa Tâm lý đồng ý pilot.
3. Có nguồn vốn/tài trợ tối thiểu ~1 tỷ cho 8 tháng.
4. Bạn hoặc đồng sáng lập sẵn sàng ưu tiên **an toàn hơn tốc độ** (chấp nhận ra mắt chậm hơn 2–3 tháng).
5. Có người bán hàng cho tổ chức (B2B/B2G).

**NO-GO (hoặc thu hẹp thành dự án cộng đồng/nghiên cứu) nếu:** không có cố vấn lâm sàng, hoặc kỳ vọng thu phí sinh viên là nguồn thu chính, hoặc muốn AI "chẩn đoán".

---

## 14. Những gì đã được lập trình trong repo này

Repo `TamLy/` chứa MVP kỹ thuật khởi đầu, phản ánh các quyết định ở trên:

- `packages/core` — Logic lõi bằng TypeScript thuần, có test: sàng lọc PHQ-9/GAD-7 tiếng Việt, **crisis detector** (luật tiếng Việt có trọng số, xử lý không dấu/teencode), **output guard**, system prompt của "An", pipeline AI 7 bước với chế độ no-LLM, thư viện kỹ năng, tiền kiểm duyệt bài đăng, danh sách hotline có trạng thái xác minh.
- `apps/api` — Fastify API (Node 24, SQLite dev) với các endpoint check-in, sàng lọc, chat, nhóm (pre-moderation), tài nguyên khẩn cấp, audit log.
- `apps/mobile` — Expo (React Native, iOS/Android/web) với các màn hình: onboarding, trang chủ + check-in, sàng lọc, chat với An, thư viện kỹ năng, nhóm, người thật (minh họa), khẩn cấp. Chat/nhóm chạy được offline bằng kịch bản + tiền kiểm duyệt trên máy.

Xem `README.md` để chạy.

---

## 15. Nguồn tham khảo chính

- V-NAMHS full report (QCMHR, 2/2023): https://qcmhr.org/outputs/reports/15-vnamhs-report-eng-15-feb-2023/file
- NAMHS multi-country, Lancet Psychiatry / PubMed 38588689: https://pubmed.ncbi.nlm.nih.gov/38588689/
- Báo cáo Tổng đài 111 năm 2025: https://tongdai111.vn/tin/bao-cao-hoat-dong-tong-dai-dien-thoai-quoc-gia-bao-ve-tre-em-111-nam-2025
- VMood/PHAD: https://www.vmood.org/ ; kết quả đến 8/2025: https://giaoducthoidai.vn/ung-dung-cong-nghe-de-lang-nghe-suc-khoe-tam-than-post746410.html
- Mindvivo: https://mindvivo.com/ ; EchoMind: https://tienphong.vn/echomind-noi-ban-tre-trut-bau-tam-su-post1821675.tpo
- Chi phí tham vấn 2025: https://vientamlyhoc.vn/chi-phi-tham-van-tam-ly-bao-nhieu-bang-gia-tu-van-mien-phi/ ; https://medpro.vn/tin-tuc/chi-phi-kham-tam-ly
- Woebot đóng cửa: https://woebothealth.com/faq/ ; https://hlth.com/insights/news/woebot-health-is-shutting-down-its-app-2025-04-28
- Baumel et al., JMIR 2019 (retention): https://www.jmir.org/2019/9/e14567/
- Character.AI/OpenAI lawsuits (CNN 9/2025): https://www.cnn.com/2025/09/16/tech/character-ai-developer-lawsuit-teens-suicide-and-suicide-attempt
- Luật BVDLCN 91/2025/QH15: https://congbao.chinhphu.vn/van-ban/luat-so-91-2025-qh15-45578.htm
- Luật Trí tuệ nhân tạo 134/2025/QH15: https://congbao.chinhphu.vn/van-ban/luat-so-134-2025-qh15-468694.htm ; Nghị định 142/2026: https://lexnovum.com.vn/nghi-dinh-142-2026-nd-cp-huong-dan-luat-tri-tue-nhan-tao-2025-doanh-nghiep-can-luu-y-gi/
- Luật Khám bệnh, chữa bệnh 15/2023/QH15 và NĐ 96/2023 (tâm lý lâm sàng): https://luatvietnam.vn/y-te/luat-15-2023-qh15-242305-d1.html ; https://moh.gov.vn/dan-hoi-bo-truong-tra-loi/-/asset_publisher/ivIoLGS83sMa/content/-ieu-kien-cap-giay-phep-hanh-nghe-tam-ly-lam-sang
- Đường dây nóng Ngày Mai: https://duongdaynongngaymai.vn/ (cần xác minh trạng thái hoạt động trước khi dùng)
