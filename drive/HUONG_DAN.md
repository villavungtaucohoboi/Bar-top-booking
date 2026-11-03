# Bộ ảnh bar TopChill — 03/11/2026

Đã rà danh sách 191 địa điểm trên https://topchill.vn/.

- 731 ảnh WebP đã tải và kiểm tra file.
- 124 quán có 4–5 ảnh.
- 62 quán có 1–3 ảnh, cần bổ sung.
- 5 quán chưa có ảnh phù hợp tải được.

Bộ này chưa đủ 4–5 ảnh cho tất cả 191 địa điểm. Xem cột Trạng thái trong Danh_sach_191_dia_diem.csv.

## Cách xem

Giải nén toàn bộ ZIP, mở TopChill_Xem_Nhanh.html. Bấm ảnh để mở ảnh lớn; bấm Nguồn ảnh để mở trang đã công bố ảnh.

## Đưa vào website

1. Chép các thư mục thành phố (hn, sg, dn...) vào /img/bars/ của website.
2. File topchill-bar-images.json hoặc topchill-bar-images.js ánh xạ ảnh theo ID hiện có, không đổi ID/tên/địa chỉ quán.
3. Chỉ cập nhật trường images của địa điểm khi danh sách mới không rỗng. Không ghi đè ảnh hiện có bằng danh sách rỗng.
4. Sau khi ghép, kiểm tra ảnh trên giao diện desktop và điện thoại.

Có thể gửi nguyên ZIP này cho người làm web/Claude. Chưa thực hiện thay đổi nào lên website đang chạy.

## Nguồn và giới hạn

Ảnh được tuyển từ các trang công khai có tên quán/thành phố tương ứng. Mỗi quán có nguon_anh.json ghi nguồn, URL ảnh và kích thước ảnh tải được. Ảnh được chuyển sang WebP, giữ tỷ lệ, tối đa 1.920 px cạnh dài, không phóng lớn ảnh nhỏ. Phần lớn ảnh có cạnh dài từ 600 px; một số ảnh Night Beach lấy theo kích thước nguồn từ 480 px.

Đã lọc file lỗi, ảnh trùng trong một quán, các ảnh AI nhận diện được, bản đồ, ảnh ghép nhận diện được và một số ảnh gán nhầm. Đây là bộ ảnh sưu tầm có nguồn để duyệt trước khi đăng; quyền sử dụng thương mại chưa được xác nhận với từng chủ ảnh. Một số nguồn/ảnh cũ có thể không phản ánh nội thất hiện tại.

Một lượt tải mở rộng và lượt thử lại bị kiểm tra tự động chặn do có nguồn ngoài phạm vi (trang massage/tên miền cho thuê xe). Các lượt đó đã dừng, ảnh nguồn không phù hợp đã loại. Các quán thiếu ảnh được ghi đúng số lượng thực tế.
