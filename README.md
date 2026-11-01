# Bartop.vn – demo đặt bàn bar toàn quốc

Web: https://villavungtaucohoboi.github.io/Bar-top-booking/

- App đặt bàn: khung giờ vàng, 3 giao diện Sáng / Nâu / Tối, ví điểm đổi tiền hoặc trừ bill, hạng thành viên, hội nhóm, gói đẩy top.
- Trang SEO tĩnh: 12 thành phố, 18 bar, blog Cẩm nang, huy hiệu đối tác.
- Khu viết bài: `/viet-bai/` (chấm điểm SEO, đăng bài lên GitHub).

## Cấu trúc

```
src/app.html        App đặt bàn + dữ liệu bar (một nguồn duy nhất)
src/seo-data.mjs    Nội dung SEO riêng từng thành phố
src/site.css        Giao diện trang tĩnh
src/editor.html     Khu viết bài
src/build.mjs       Bộ build: node src/build.mjs
src/config.json     Tên miền, đường dẫn gốc, bật/tắt lập chỉ mục
content/blog/*.md   Bài viết
public/             Icon, manifest
```

Các thư mục `bar-*/`, `bar/`, `blog/`, `assets/`, `index.html`, `sitemap.xml` do build sinh ra. Không sửa tay.

GitHub Actions tự chạy build khi có thay đổi trong `content/`, `src/`, `public/`.

Chi tiết SEO và kế hoạch backlink: [SEO.md](SEO.md).

Dữ liệu bar, số liệu, đánh giá là minh hoạ. Web đang để `noindex` cho tới khi có dữ liệu thật.
