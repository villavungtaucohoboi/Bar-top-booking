# SEO TopChill: kiểm tra, cấu trúc, từ khóa, backlink

## 1. Kết quả kiểm tra bản cũ

| Vấn đề | Mức độ | Đã xử lý |
|---|---|---|
| Cả web là một trang duy nhất, chuyển màn bằng `#`. Google chỉ thấy 1 URL. | Nghiêm trọng | Sinh trang tĩnh riêng cho 12 thành phố, 18 bar, blog |
| Nội dung do JavaScript vẽ, HTML gốc gần như trống chữ | Nghiêm trọng | Trang thành phố, bar, bài viết là HTML thuần |
| Không có thẻ mô tả, canonical, Open Graph | Cao | Có đủ trên mọi trang |
| Tiêu đề chung chung “TOPCHILL Việt Nam” | Cao | Tiêu đề chứa từ khóa, 45–65 ký tự |
| Không có sitemap, robots | Cao | `sitemap.xml`, `robots.txt` tự sinh |
| Không có dữ liệu cấu trúc | Trung bình | WebSite, Organization, BreadcrumbList, ItemList, BarOrPub, BlogPosting, FAQPage |
| Không có nội dung bài viết | Cao | Blog + 6 bài mẫu + khu viết bài |
| Ảnh không có mô tả | Trung bình | Mọi ảnh có `alt` chứa tên bar, thành phố |
| Không có liên kết nội bộ | Trung bình | Breadcrumb, link chéo thành phố ↔ bar ↔ bài viết |

Kết quả bò thử toàn site sau khi sửa: 38 trang, không link hỏng, không lỗi script. Mỗi trang có đúng một H1, không trùng tiêu đề hay mô tả, không tràn ngang trên điện thoại.

## 2. Cấu trúc URL

```
/                         Trang chủ (app đặt bàn)
/bar-ha-noi/              Trang thành phố  → từ khóa "bar hà nội"
/bar/moc-sky-bar/         Trang từng bar   → từ khóa "mộc sky bar", "rooftop tây hồ"
/blog/                    Cẩm nang
/blog/<bai-viet>/         Bài viết         → từ khóa thông tin, dài
/huy-hieu/                Huy hiệu đối tác (kéo backlink)
/viet-bai/                Khu viết bài (noindex, nội bộ)
```

Đặt bàn từ trang tĩnh dẫn về app bằng `/#dat-<id>` (mở thẳng bar) và `/#tp-<mã tỉnh>` (lọc theo tỉnh).

## 3. Bản đồ từ khóa

| Từ khóa | Trang đích | Loại |
|---|---|---|
| bar hà nội, bar sài gòn, bar đà nẵng… | `/bar-<tinh>/` | Giao dịch, lượng tìm lớn |
| rooftop bar sài gòn | `/blog/rooftop-bar-sai-gon/` | Thông tin + giao dịch |
| bar hà nội đáng đi | `/blog/bar-ha-noi-dang-di-nhat/` | Thông tin |
| giá đặt bàn bar, giá bàn vip bar | `/blog/gia-dat-ban-bar/` | Thông tin |
| kinh nghiệm đi bar, đi bar lần đầu | `/blog/kinh-nghiem-di-bar-lan-dau/` | Thông tin |
| đặt bàn bar, đặt bàn bar giảm giá | `/blog/cach-dat-ban-bar-giam-gia/` + trang chủ | Giao dịch |
| tên bar cụ thể | `/bar/<ten-bar>/` | Thương hiệu |

**Bài nên viết tiếp** (mỗi tuần 2 bài): bar Vũng Tàu, bar Phú Quốc, bar Nha Trang, beach club Việt Nam, club Hà Nội, club Sài Gòn, bar quận 1, bar Tây Hồ, bar có nhạc live, bar cho người đi một mình, tổ chức sinh nhật ở bar, bar view đẹp chụp ảnh, giá rượu ở bar, dress code đi bar.

Mỗi bài: một từ khóa chính, 800+ từ, ít nhất 3 link nội bộ tới trang thành phố hoặc bar, có mục “Câu hỏi thường gặp”. Khu viết bài chấm đủ các tiêu chí này.

## 4. Quy trình viết bài

1. Mở `/viet-bai/`, nhập từ khóa, tiêu đề, mô tả, nội dung.
2. Sửa đến khi điểm SEO từ 80 trở lên.
3. Bấm “Đăng lên web”. GitHub mở trang tạo file đã điền sẵn, bấm “Commit changes”.
4. GitHub Actions tự build. Khoảng 2 phút sau bài lên mục Cẩm nang, có sẵn trong sitemap.

Bài lưu tại `content/blog/*.md`. Thêm `draft: true` vào phần đầu file để ẩn bài.

## 5. Kế hoạch backlink

Backlink không tạo được bằng code. Đây là các nguồn nên làm theo thứ tự hiệu quả.

1. **Huy hiệu đối tác.** Mỗi bar đối tác gắn huy hiệu “Top bar trên TopChill” lên website, fanpage, menu QR. Mã nhúng lấy ở `/huy-hieu/`. Nguồn link liên quan, tự nhiên, tăng theo số bar.
2. **Website trong hệ sinh thái Vivatrip.** Bài “bar gần villa Vũng Tàu”, “đi chơi đêm ở Phú Quốc” trên vivatrip.vn link về trang thành phố tương ứng. Cùng chủ đề du lịch, liên quan cao.
3. **Hồ sơ doanh nghiệp.** Google Business Profile, Facebook, Instagram, TikTok, YouTube, Zalo OA, LinkedIn. Mỗi hồ sơ đặt link web.
4. **Danh bạ, nền tảng địa phương.** Foody, Tripadvisor, Trang Vàng, Cốc Cốc Map, Apple Maps.
5. **Báo chí, PR.** Bài về giải thưởng “Top bar của năm” do TopChill bình chọn, gửi báo giải trí và du lịch. Bài trả phí phải gắn `rel="sponsored"` theo quy định của Google.
6. **Cộng đồng.** Trả lời câu hỏi “đi bar ở đâu” trên các group du lịch, Reddit, Voz, Tinhte kèm link bài viết liên quan. Viết như người thật, không spam.
7. **Blogger, TikToker đêm.** Mời trải nghiệm miễn phí, đổi lại bài review có link.

**Không làm:** mua link hàng loạt, PBN, trao đổi link đại trà, spam bình luận. Google phạt cả domain.

## 6. Trước khi bật cho Google lập chỉ mục

Hiện web đang ở chế độ demo: mọi trang có `noindex`, `robots.txt` chặn toàn bộ. Lý do: tên bar, địa chỉ, đánh giá đang là dữ liệu minh hoạ. Để Google lập chỉ mục thông tin bar không có thật sẽ làm sai lệch người tìm kiếm và khó gỡ sau này.

Khi ra mắt thật:

1. Tên miền `topchill.vn` đã trỏ vào GitHub Pages.
2. Trong `src/config.json`: đổi `allowIndexing` thành `true`.
3. Thay dữ liệu bar minh hoạ trong `src/app.html` bằng bar thật. Dùng ảnh thật do chủ bar cung cấp, tự lưu dạng WebP thay vì ảnh Unsplash.
4. Chỉ thêm điểm đánh giá vào dữ liệu cấu trúc khi có đánh giá thật từ khách.
5. Thêm web vào Google Search Console, gửi `sitemap.xml`.
6. Hotline, Zalo, Telegram đã dùng số thật 0838 000 222.

Lưu ý: trên địa chỉ con dạng `github.io/Bar-top-booking`, Google không đọc file `robots.txt` của thư mục con. Thẻ `noindex` trên từng trang mới là thứ đang chặn lập chỉ mục. Khi có tên miền riêng, cả hai sẽ cùng có hiệu lực.

## 7. Chỉ số cần theo dõi hằng tháng

- Search Console: số trang được lập chỉ mục, lượt hiển thị, lượt nhấp, vị trí trung bình theo từ khóa.
- Số bar đối tác gắn huy hiệu.
- Số domain trỏ link về (Ahrefs Webmaster Tools miễn phí).
- Tỷ lệ chuyển đổi từ trang thành phố và bài viết sang đặt bàn.
