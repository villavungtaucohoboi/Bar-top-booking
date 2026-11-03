# Bảo mật TopChill

## Đã có trên web

| Lớp | Tác dụng |
|---|---|
| Content-Security-Policy | Trang chỉ chạy script, font, ảnh từ nguồn đã cho phép. Mã độc chèn từ nơi khác bị trình duyệt chặn. |
| Lọc dữ liệu người dùng | Tin nhắn Hội nhóm, ghi chú đặt bàn, khung chat đều được lọc trước khi hiển thị. Không chèn được mã độc (XSS). |
| Giới hạn độ dài | Tin nhắn tối đa 500 ký tự, ghi chú 300 ký tự. |
| Khoá tên miền | Bản sao chạy ở tên miền khác `topchill.vn` hiện cảnh báo "bản sao trái phép" và chuyển về topchill.vn. |
| Chống nhúng khung | Trang khác lồng topchill.vn vào iframe thì nội dung tự ẩn (chống lừa bấm). |
| HTTPS bắt buộc | GitHub Pages ép HTTPS, CSP tự nâng mọi tài nguyên lên HTTPS. |
| Nén, làm rối code | JS, CSS, HTML trên web đã bỏ chú thích, rút gọn tên biến. |
| Bản quyền | Chân trang, đầu mỗi file và `LICENSE` ghi rõ bảo lưu mọi quyền. Là căn cứ gửi yêu cầu gỡ (DMCA) nếu bị sao chép. |
| Mật khẩu | Tài khoản demo lưu mật khẩu dạng băm SHA-256, không lưu bản rõ. |

## Giới hạn cần biết

- Code chạy trên trình duyệt luôn tải được về máy khách. Không có cách nào giấu tuyệt đối. Nén code chỉ làm khó đọc và khó sửa.
- Kho GitHub đang **công khai**: ai cũng tải được mã nguồn gốc. Xem mục "Việc chủ web cần làm".
- GitHub Pages không cho đặt header HTTP. Một số lớp (frame-ancestors, HSTS tuỳ chỉnh) chỉ đặt được khi chuyển sang Cloudflare.
- Tài khoản, điểm hiện lưu trên máy khách (demo). Khi lên thật phải chuyển sang máy chủ (Firebase) với luật bảo mật phía máy chủ.

## Việc chủ web cần làm

1. **Bật xác thực 2 lớp (2FA)** cho tài khoản GitHub, Google, cloud360.
2. **Xác minh tên miền trên GitHub**: Settings → Pages → Add a domain → thêm bản ghi TXT `_github-pages-challenge-villavungtaucohoboi` ở cloud360. Chặn người khác chiếm topchill.vn bằng repo của họ.
3. **Khoá chuyển nhượng tên miền** (Domain lock) ở cloud360.
4. **Đặt kho mã nguồn ở chế độ riêng tư** (một trong ba cách):
   - GitHub Pro (khoảng 4 USD/tháng): repo riêng tư vẫn dùng GitHub Pages.
   - Cloudflare Pages (miễn phí): repo riêng tư, thêm header bảo mật, chống DDoS.
   - Hai repo (miễn phí): repo nguồn riêng tư, repo công khai chỉ chứa bản đã nén.
5. **Bảo vệ nhánh main**: Settings → Branches → chặn force push, chặn xoá nhánh.
6. Không chia sẻ tài khoản GitHub, cloud360 cho người khác. Cấp quyền riêng nếu cần.

## Báo lỗ hổng

Gửi về hotline/Zalo 0838 000 222.
