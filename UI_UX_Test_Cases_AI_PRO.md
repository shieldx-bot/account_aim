# BỘ KỊCH BẢN KIỂM THỬ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX TEST CASES)
## TÍNH NĂNG TRỌNG YẾU: MÀN HÌNH THANH TOÁN SIÊU TỐC (ULTRA-FAST GUEST CHECKOUT)
*Dự án: Nền tảng phân phối tài khoản AI Pro cho Developers*  
*Tài liệu đối chiếu: `SPEC-UIUX-AIPRO-2026` / `UI_UX_Specification_AI_PRO.md`*  
*Quy chuẩn Design System: Dark-Mode High-Tech (#08090C, #0066FF, #00F0FF, Inter & JetBrains Mono)*  
*Chịu trách nhiệm: Senior QA/QC Specialist (UI/UX Automation & Manual Testing)*

---

### TỔNG QUAN PHẠM VI KIỂM THỬ
Màn hình **Thanh toán Siêu Tốc (Guest Checkout)** là "nút thắt cổ chai" quyết định trực tiếp đến tỷ lệ chuyển đổi của toàn bộ hệ thống. Mục tiêu kiểm thử là đảm bảo luồng giao dịch diễn ra dưới 60 giây, không có độ trễ thị giác, không có ma sát nhập liệu, phản hồi trạng thái thanh toán tự động tức thì (Zero-friction Hand-off) và thích ứng hoàn hảo trên mọi thiết bị di động (Thumb Zone).

---

## BẢNG KỊCH BẢN KIỂM THỬ CHI TIẾT (UI/UX TEST MATRIX)

### NHÓM 1: KIỂM THỬ ĐỘ TRỰC QUAN (VISUAL TESTING)
*Mục tiêu: Kiểm tra sự đồng nhất về màu sắc, typography, khoảng cách (spacing 8pt), căn lề, icon và độ tương phản theo Design System.*

| ID | Phân loại | Thành phần kiểm thử (Component) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- |
| **TC_VIS_01** | UI | Nền trang tổng thể (Canvas Background) | 1. Truy cập vào trang `/checkout`<br>2. Kiểm tra background của body và các container chính bằng DevTools Inspect. | - Nền canvas hiển thị đúng mã màu `--bg-canvas` (`#08090C`).<br>- Không xuất hiện vệt sáng, viền trắng hoặc răng cưa ở các góc bo.<br>- Đạt độ tương phản chuẩn WCAG AAA với màu chữ chính. |
| **TC_VIS_02** | UI | Header tối giản (Minimal Checkout Header) | 1. Quan sát phần Header trên cùng của trang checkout. | - Chỉ chứa Logo `AIPro.dev` (Terminal icon `>_` phối màu Neon Cyan `#00F0FF` + Electric Blue `#0066FF`) và biểu tượng Khóa bảo mật `🔒 256-bit SSL`.<br>- Chiều cao header đúng `64px`, căn giữa theo chiều dọc.<br>- **Tuyệt đối không có thanh menu điều hướng** (Navigation Links) nhằm tránh làm người dùng phân tâm thoát trang. |
| **TC_VIS_03** | UI | Thẻ Tóm tắt đơn hàng (Order Summary Card) | 1. Quan sát cột bên phải màn hình checkout.<br>2. Kiểm tra font chữ, kích thước giá tiền và các dòng chi phí. | - Card có nền `--bg-surface` (`#101318`), bo góc `12px`, border `1px solid #232936`.<br>- Tên gói hiển thị đúng dạng `Cursor Pro (3 Tháng)`.<br>- Dòng giá niêm yết có gạch ngang (`line-through`), màu `--text-muted` (`#6B7280`).<br>- Dòng "Ưu đãi Dev" hiển thị màu xanh lá `--status-success` (`#10B981`).<br>- Dòng "Thuế & Phí" ghi rõ `+ 0 ₫` (Minh bạch chi phí).<br>- Số tiền Tổng thanh toán hiển thị font `JetBrains Mono` 32px Bold, màu sáng rõ `--text-primary` (`#F3F4F6`). |
| **TC_VIS_04** | UI | Khung quét mã VietQR (Dynamic QR Container) | 1. Chọn phương thức thanh toán VietQR.<br>2. Quan sát khung hiển thị mã QR và các trường thông tin đi kèm. | - Mã QR kích thước đúng `220x220px`, được đặt trên nền trắng bo góc `8px` với viền tương phản rõ nét.<br>- Vòng tròn radar pulse (hiệu ứng quét sóng xanh) xoay/nhấp nháy mượt mà quanh QR mà không làm vỡ layout.<br>- Các nút `Sao chép STK`, `Sao chép Số tiền`, `Sao chép Nội dung` hiển thị icon clipboard sắc nét, kích thước chuẩn `16x16px`. |
| **TC_VIS_05** | UI | Đồng hồ đếm ngược giữ slot (Order Countdown Timer) | 1. Quan sát widget đếm ngược ở cột phải. | - Đồng hồ hiển thị định dạng `MM:SS` (ví dụ: `09:59`), sử dụng font monospace `JetBrains Mono` để chữ số không bị giật/nhảy vị trí khi đếm lùi.<br>- Màu sắc hiển thị màu vàng cam cảnh báo `--status-warning` (`#F59E0B`).<br>- Thanh Progress Bar nằm ngay dưới đồng hồ, co lại từ 100% về 0% theo chiều ngang mượt mà. |
| **TC_VIS_06** | UI | Huy hiệu an toàn & Tín hiệu tin cậy (Trust Signals) | 1. Cuộn mắt xuống khu vực chân khung thanh toán. | - Hiển thị đủ 3 biểu tượng tin cậy: Icon khiên bảo vệ `🛡️ Hoàn tiền 100% nếu lỗi`, Icon tia sét `⚡ Kích hoạt trong 30 giây`, Icon bảo mật `🔒 Thanh toán mã hóa 256-bit`.<br>- Font chữ 13px, màu `--text-secondary` (`#9CA3AF`), khoảng cách giữa các icon là `16px`. |

---

### NHÓM 2: KIỂM THỬ TRẠNG THÁI PHẦN TỬ (ELEMENT STATES)
*Mục tiêu: Đảm bảo các trạng thái Default, Hover, Focus, Active, Disabled và Loading phản hồi chuẩn xác theo CSS Design Tokens.*

| ID | Phân loại | Thành phần kiểm thử (Component) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- |
| **TC_STA_01** | UI/UX | Ô nhập Email khách hàng (Guest Email Input) | 1. Rê chuột vào ô Email (Hover).<br>2. Nhấp chuột vào ô Email (Focus).<br>3. Nhấp ra ngoài vùng trống (Blur). | - **Default**: Nền `--bg-canvas` (`#08090C`), viền `--border-subtle` (`#232936`), placeholder màu xám mờ `--text-muted`.<br>- **Hover**: Viền sáng nhẹ chuyển sang màu `#374151`.<br>- **Focus**: Viền đổi sang màu xanh thương hiệu `--border-focus` (`#0066FF`), xuất hiện viền glow nhẹ `box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.25)`. Icon phong bì đổi từ xám sang xanh.<br>- **Blur**: Trở về viền default nếu đã nhập đúng hoặc giữ viền đỏ nếu có lỗi. |
| **TC_STA_02** | UI/UX | Bộ chuyển đổi kênh thanh toán (Payment Tabs) | 1. Quan sát trạng thái ban đầu của 3 Tabs (VietQR, Thẻ Quốc Tế, Crypto).<br>2. Rê chuột qua từng Tab.<br>3. Nhấp chọn lần lượt từng Tab. | - **Default (In-active)**: Nền `--bg-surface`, viền `--border-subtle`, chữ `--text-secondary`.<br>- **Hover**: Nền chuyển sang `--bg-elevated` (`#181C24`), chữ sáng lên `--text-primary`. Con trỏ đổi thành `cursor: pointer`.<br>- **Active (Selected)**: Viền và nền đổi sang `--primary-blue` (`#0066FF`), chữ trắng in đậm, hiển thị chấm tròn xanh phát sáng (active indicator). Khung nội dung tương ứng chuyển tab ngay tức thì mà không giật màn hình. |
| **TC_STA_03** | UI/UX | Nút sao chép nhanh (Fast Copy Buttons) | 1. Rê chuột vào nút `Sao chép STK`.<br>2. Nhấp chuột vào nút.<br>3. Rê chuột ra ngoài. | - **Default**: Ghost button viền mỏng xám, text `Sao chép` kèm icon clipboard.<br>- **Hover**: Nền đổi màu xám đen `#1F2937`, chữ đổi màu trắng.<br>- **Active / Click**: Nút đổi sang icon checkmark màu xanh lá `✓ Đã sao chép`, nền ánh xanh lục nhẹ. Sau đúng `2.0 giây`, nút tự động hoàn nguyên về trạng thái Default. |
| **TC_STA_04** | UI/UX | Nút xác nhận thanh toán (Primary CTA Button - nếu có) | 1. Khi chưa nhập Email hoặc Email sai định dạng.<br>2. Khi đã nhập Email hợp lệ. | - **Disabled**: Nền xám đen `#1F2430`, chữ xám `#6B7280`, con trỏ chuột dạng `not-allowed`, không thể tương tác click.<br>- **Enabled**: Nền xanh `--primary-blue`, chữ trắng đậm, con trỏ dạng pointer, hiệu ứng hover sáng hơn `--primary-hover` (`#257CFF`). |
| **TC_STA_05** | UI/UX | Trạng thái đồng hồ đếm ngược hết hạn (Timer Expired State) | 1. Đợi đồng hồ đếm ngược về `00:00` (hoặc giả lập hết hạn trong DevTools). | - Khung mã VietQR bị làm mờ bằng lớp phủ xám đen `backdrop-filter: blur(4px)` và `opacity: 0.4`.<br>- Một nút bấm nổi bật xuất hiện đè lên giữa mã QR: `🔄 Làm mới mã thanh toán`.<br>- Các nút sao chép chuyển sang trạng thái Disabled. |

---

### NHÓM 3: KIỂM THỬ LOGIC DỮ LIỆU & VALIDATION
*Mục tiêu: Đảm bảo logic tính toán giá, định dạng dữ liệu, kiểm tra ràng buộc trường nhập liệu và xử lý các kịch bản biên (Edge Cases).*

| ID | Phân loại | Thành phần kiểm thử (Component) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- |
| **TC_VAL_01** | UX | Ô nhập Email - Bỏ trống trường bắt buộc | 1. Để trống ô Email.<br>2. Nhấp ra ngoài (Blur) hoặc quét mã thanh toán. | - Trường viền đổi sang màu đỏ `--status-error` (`#EF4444`).<br>- Hiển thị dòng thông báo lỗi ngay dưới ô nhập: *"Email là bắt buộc để nhận tài khoản và kích hoạt bảo hành"*. |
| **TC_VAL_02** | UX | Ô nhập Email - Nhập sai định dạng email | 1. Nhập các chuỗi không hợp lệ: `dev`, `dev@`, `dev@domain`, `dev@.com`, `dev@@gmail.com`, `dev name@gmail.com`.<br>2. Nhấp ra ngoài ô nhập. | - Hệ thống kích hoạt validation real-time.<br>- Báo viền đỏ `--status-error`.<br>- Hiển thị thông báo: *"Địa chỉ email không đúng định dạng chuẩn (ví dụ: name@company.com)"*.<br>- Không cho phép hoàn tất đơn hàng. |
| **TC_VAL_03** | UX | Ô nhập Email - Nhập email hợp lệ | 1. Nhập email hợp lệ: `alex.engineer@gmail.com`. | - Viền ô chuyển sang màu xanh lá thành công `--status-success`.<br>- Icon checkmark xanh lá `✓` xuất hiện ở góc phải bên trong ô input.<br>- Thông báo lỗi (nếu có trước đó) biến mất ngay lập tức. |
| **TC_VAL_04** | UX | Ô nhập Email - Kiểm tra độ dài tối đa (Boundary Value) | 1. Nhập chuỗi email dài đúng 120 ký tự hợp lệ.<br>2. Cố gắng nhập thêm ký tự thứ 121 trở đi. | - Cho phép nhập tối đa 120 ký tự.<br>- Không cho phép nhập vượt quá 120 ký tự (thuộc tính `maxlength="120"` chặn ký tự thừa).<br>- Giao diện không bị tràn chữ ra ngoài khung input (No text overflow). |
| **TC_VAL_05** | UX | Chức năng Sao chép vào Clipboard (Clipboard API) | 1. Nhấp nút `Sao chép STK` (MB Bank).<br>2. Dán (Ctrl+V) vào Notepad hoặc trình duyệt.<br>3. Làm tương tự với `Số tiền` và `Nội dung chuyển khoản`. | - Dữ liệu dán ra phải khớp 100% với dữ liệu hiển thị trên giao diện, không bị dính khoảng trắng thừa ở đầu/cuối.<br>- Số tiền dán ra chỉ gồm chữ số (ví dụ: `749000`), không lẫn ký tự `₫` hay dấu chấm để tránh lỗi app ngân hàng. |
| **TC_VAL_06** | UX | Logic Tự động nhận diện thanh toán (Webhook / WebSocket Auto-Handshake) | 1. Giả lập Backend nhận được Webhook thanh toán thành công từ ngân hàng.<br>2. Quan sát phản hồi giao diện tức thì của màn hình checkout. | - Giao diện phát âm thanh thông báo nhẹ (Success chime).<br>- Khung QR chuyển sang trạng thái thành công: Icon dấu tích xanh to bản `✓ ĐÃ NHẬN TIỀN THÀNH CÔNG`.<br>- **Tự động chuyển hướng (Auto-redirect)** sang Trang 4 (Bàn Giao & Quản Lý) sau đúng `1.2 giây`.<br>- Người dùng không cần chạm hay bấm bất kỳ nút xác nhận nào. |
| **TC_VAL_07** | UX | Kịch bản chuyển thiếu tiền (Partial Payment Edge Case) | 1. Giả lập đơn hàng `749.000 ₫`, khách chuyển vào tài khoản `700.000 ₫` kèm đúng cú pháp. | - Màn hình không chuyển sang trang thành công.<br>- Xuất hiện Modal cảnh báo màu vàng cam: *"Hệ thống đã nhận 700.000 ₫ (Thiếu 49.000 ₫ so với giá trị đơn hàng)"*.<br>- Mã QR tự động cập nhật lại với số tiền đúng bằng phần tiền còn thiếu (`49.000 ₫`) kèm nút liên hệ kỹ thuật viên khẩn cấp. |
| **TC_VAL_08** | UX | Kịch bản rớt mạng giữa chừng (Network Disconnection) | 1. Người dùng đang ở màn hình checkout.<br>2. Ngắt kết nối mạng (Turn off Wi-Fi/Offline mode trên DevTools). | - Thanh thông báo Toaster màu đỏ cam trượt xuống từ đỉnh màn hình: *"Đang mất kết nối mạng. Hệ thống sẽ tự động đồng bộ lại khi có Internet"*.<br>- Toàn bộ thông tin email đã gõ được bảo lưu trong `LocalStorage`, khi bật lại mạng không bị reset trắng trang. |

---

### NHÓM 4: KIỂM THỬ THIẾT BỊ, RESPONSIVE & KHẢ NĂNG TIẾP CẬN (MOBILE & RESPONSIVE)
*Mục tiêu: Đảm bảo giao diện hiển thị hoàn hảo trên Desktop (12 cột), Tablet (8 cột) và Mobile (Thumb Zone, Tap target 44px, bàn phím ảo).*

| ID | Phân loại | Thành phần kiểm thử (Component) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- |
| **TC_RSP_01** | UI/UX | Hiển thị trên Desktop màn hình lớn (`width >= 1200px`) | 1. Mở màn hình checkout trên độ phân giải `1920x1080` và `1440x900`. | - Layout chia 2 cột rõ ràng (Tỷ lệ 6:6 hoặc 7:5).<br>- Cột trái chứa Form Email & Cổng thanh toán; Cột phải chứa Order Summary cố định (Sticky).<br>- Nội dung căn giữa màn hình, lề 2 bên cân đối (Max-width `1200px`). |
| **TC_RSP_02** | UI/UX | Hiển thị trên Tablet (`768px <= width <= 1024px`) | 1. Thu nhỏ trình duyệt về kích thước iPad/Tablet (`768px`, `820px`). | - Layout chuyển sang dạng 1 cột hoặc 2 cột thu gọn tỷ lệ padding `16px`.<br>- Không có thanh cuộn ngang (Horizontal scrollbar).<br>- Các nút bấm và mã QR giữ nguyên tỷ lệ sắc nét, không bị bẹp hình. |
| **TC_RSP_03** | UI/UX | Hiển thị trên Mobile (`width: 375px - 430px` - iPhone, Samsung Galaxy) | 1. Mở trang trên giả lập iPhone 14/15/16 Pro (Width `393px`).<br>2. Quan sát thứ tự phân cấp thông tin. | - Bố cục chuyển thành **1 cột duy nhất xếp chồng (Stacked Layout)**:<br>  1. Tóm tắt số tiền ngắn gọn ở trên cùng.<br>  2. Ô nhập Email.<br>  3. Tabs phương thức thanh toán.<br>  4. Khung mã QR & Thông tin tài khoản.<br>  5. Cam kết bảo hành.<br>- Mã QR tự co giãn vừa vặn khung hình (kích thước tối ưu `200x200px` trên mobile). |
| **TC_RSP_04** | UX | Kiểm tra vùng chạm ngón cái (Thumb Zone & Tap Target) trên Mobile | 1. Dùng ngón tay cái thao tác trên thiết bị di động thật.<br>2. Kiểm tra kích thước vùng bấm của các nút Tab, nút Sao chép và nút CTA. | - Tất cả các nút bấm đều đạt kích thước tối thiểu **44x44 pixel**.<br>- Khoảng cách giữa các nút sao chép tối thiểu `10px`, không xảy ra hiện tượng chạm nhầm nút này sang nút khác.<br>- Các nút bấm nằm trong vùng chạm thuận tiện nhất của ngón cái (Lower screen half). |
| **TC_RSP_05** | UX | Kích hoạt bàn phím ảo tối ưu (Virtual Keyboard UX) | 1. Trên điện thoại, chạm vào ô nhập Email.<br>2. Chạm vào ô nhập mã xác thực OTP (nếu có). | - Chạm ô Email: Bàn phím tự động mở ở chế độ email với sẵn phím `@` và đuôi `.com` (nhờ thuộc tính `type="email" inputmode="email"`).<br>- Bàn phím trồi lên không che khuất ô nhập liệu (View tự động cuộn nhẹ để giữ ô input nằm trên bàn phím). |
| **TC_RSP_06** | UI | Kiểm tra khi xoay ngang màn hình điện thoại (Landscape Mode) | 1. Trên thiết bị di động, xoay ngang màn hình (Orientation: Landscape). | - Bố cục không bị vỡ hoặc che khuất mã QR.<br>- Cho phép cuộn dọc mượt mà để xem toàn bộ thông tin tài khoản và mã thanh toán. |

---

## 3. MA TRẬN ĐÁNH GIÁ MỨC ĐỘ NGHIÊM TRỌNG (DEFECT SEVERITY MATRIX)

Dành cho Tester khi log bug lên Jira / Linear:

- **Blocker (P0)**:
  - Webhook nhận tiền thành công nhưng hệ thống không tự chuyển sang Trang 4.
  - Mã VietQR sinh ra bị sai số tiền hoặc sai cú pháp chuyển khoản khiến khách thanh toán nhầm.
  - Ô nhập email không nhận ký tự hoặc chặn luôn email hợp lệ.
- **Critical (P1)**:
  - Đồng hồ đếm ngược hết hạn nhưng mã QR cũ vẫn không bị disable, gây rủi ro khách chuyển tiền vào phiên đã hủy.
  - Vỡ layout trên màn hình Mobile (`width < 390px`), nút Sao chép bị che khuất không bấm được.
- **Major (P2)**:
  - Nút `Sao chép STK` sao chép dính khoảng trắng hoặc ký tự lạ vào clipboard.
  - Mất kết nối mạng nhưng không có Toaster thông báo cho người dùng.
- **Minor / Trivial (P3)**:
  - Sai lệch màu sắc viền 1-2px so với mã token trong Design System.
  - Tooltip `Đã sao chép` hiển thị lệch 4px so với tâm nút bấm.

---

## 4. CHECKLIST PHÊ DUYỆT RELEASE (SIGN-OFF CRITERIA)
- [ ] 100% Test Cases nhóm **Validation (Nhóm 3)** vượt qua thành công (Pass).
- [ ] Không còn bất kỳ lỗi nào ở mức độ **Blocker (P0)** hoặc **Critical (P1)** còn mở.
- [ ] Thời gian tải trang thực tế (LCP) trên mạng 4G đạt dưới **1.5 giây**.
- [ ] Đã test thành công trên 4 trình duyệt cốt lõi: Chrome, Safari iOS, Firefox, Edge.
- [ ] Điểm Google Lighthouse Accessibility đạt tối thiểu **95/100**.
