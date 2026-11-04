# Hướng dẫn viết bài Cẩm nang TopChill (dùng cho phiên viết bài tự động hằng ngày)

Mỗi ngày viết **1 bài** tiếng Việt, chuẩn SEO, đăng vào `content/blog/<slug>.md`. GitHub Actions sẽ tự build và đăng lên https://topchill.vn/blog/<slug>/.

## 1. Chọn chủ đề

1. Đọc danh sách bài đã có: `ls content/blog/` và dòng `keyword:` trong từng file. **Không viết trùng từ khoá chính** với bài đã có (kể cả bài `draft: true`).
2. Chọn một từ khoá mà người Việt hay tìm khi đi chơi đêm, gắn với dữ liệu bar thật trong `content/data.json`. Xoay vòng theo các nhóm:
   - Theo thành phố: "bar [thành phố]", "pub [thành phố]", "club [thành phố]", "rooftop bar [thành phố]", "bar view đẹp [thành phố]", "bar [quận/khu vực]".
   - Theo loại hình: cocktail bar, beer club, lounge, jazz bar, beach club, whisky bar, speakeasy.
   - Theo nhu cầu: đi bar sinh nhật, đi bar hẹn hò, đi bar nhóm đông, bar có nhạc sống, bar cho người mới, bar mở khuya.
   - Kinh nghiệm chung: dress code, đặt bàn, giá đồ uống tham khảo, an toàn khi đi chơi đêm, uống có trách nhiệm.
3. Ưu tiên thành phố/loại hình chưa có bài. Mỗi bài nhắm **1 từ khoá chính** + 3–5 từ khoá phụ tự nhiên.

## 2. Nguồn dữ liệu và tính trung thực (bắt buộc)

- Chỉ nhắc tới bar có trong `content/data.json` với `hidden` khác `true`. Lấy đúng `name`, `area`, `addr`, `type`, `music`, `desc`, `hours`.
- **Không bịa**: điểm đánh giá, số lượt review, giải thưởng, khuyến mãi, giờ mở cửa, số điện thoại, "nhất/top 1".
- Bar có `hoursKnown: false` → viết "giờ mở cửa: gọi tổng đài 0838 000 222 để xác nhận".
- Giá: bar có `priceEst: true` là **giá tham khảo** → viết "mức chi tham khảo từ …k/người", không khẳng định chắc chắn.
- Ưu đãi qua TopChill chỉ nhắc với bar có `partner` khác `false` (deal/gpct/bonus thật trong data). Hạng thành viên: Newbie (hỗ trợ 24/7, không cần cọc), Silver 20 triệu giảm 5%, Vàng 80 triệu giảm 8% + rượu sinh nhật, Platinum 150 triệu giảm 10%.
- Luôn có 1 câu nhắc uống có trách nhiệm, không lái xe sau khi uống.

## 3. Ảnh

- Chỉ dùng ảnh có sẵn trong kho của web: `content/img/bars/<city>/<id-slug>/NN.webp` (đường dẫn trong bài viết dạng `/img/bars/<city>/<id-slug>/NN.webp`, đúng như trường `images` của bar trong data.json).
- `cover:` = ảnh đầu tiên của bar nổi bật nhất trong bài. Chèn thêm 2–4 ảnh trong thân bài, mỗi ảnh của một bar được nhắc tới, alt mô tả có tên bar + thành phố: `![Không gian Cloud Sky Bar, phố cổ Hà Nội](/img/bars/hn/79-cloud-sky-bar/02.webp)`.
- Kiểm tra file ảnh tồn tại trước khi dùng. Không tải ảnh từ web khác (bản quyền).

## 4. Định dạng file

```
---
title: "≤ 60 ký tự, chứa từ khoá chính ở đầu"
description: "140–160 ký tự, chứa từ khoá, nói rõ lợi ích khi đọc"
keyword: "từ khoá chính viết thường"
date: YYYY-MM-DD
updated: YYYY-MM-DD
cover: /img/bars/.../01.webp
coverAlt: "Mô tả ảnh bìa có từ khoá"
tags: [Thành phố, Loại hình]
city: hn            # mã thành phố nếu bài về 1 thành phố: hn sg dn nt pq dl hp vt ql ct hue bd
bars: [slug-bar-1, slug-bar-2]   # slug = trang /bar/<slug>/ (xem thư mục bar/ hoặc tính từ tên)
author: "Ban biên tập TopChill"
---
```

Thân bài (1.000–1.600 từ):
- Đoạn mở đầu 2–3 câu, **từ khoá chính in đậm** trong câu đầu.
- 4–7 mục `##`, tiêu đề dạng câu hỏi hoặc chứa từ khoá phụ. Mục con `###` cho từng bar.
- Mỗi bar: 2–4 câu từ dữ liệu thật + danh sách ngắn (khu vực, loại hình, nhạc, mức chi tham khảo) + link nội bộ `[Tên bar](/bar/<slug>/)`.
- Ít nhất 3 link nội bộ: trang bar, trang thành phố (`/bar-ha-noi/`, `/bar-sai-gon/`, `/bar-da-nang/`, `/bar-nha-trang/`, `/bar-phu-quoc/`, `/bar-da-lat/`, `/bar-hai-phong/`, `/bar-vung-tau/`, `/bar-ha-long/`, `/bar-can-tho/`, `/bar-hue/`, `/bar-binh-duong/`), bài cẩm nang khác `/blog/<slug>/` nếu liên quan.
- Có thể có 1 bảng so sánh (`| … |`).
- 1 khối CTA:
  ```
  :::cta
  Tiêu đề ngắn kêu gọi đặt bàn
  Một câu: gọi 0838 000 222 hoặc để lại số, tổng đài giữ bàn, không cần cọc.
  :::
  ```
- Kết thúc bằng `## Câu hỏi thường gặp` với 3–4 câu `###` + trả lời ngắn (tạo FAQ schema).
- Văn phong: tự nhiên, câu ngắn, xưng "bạn", không nhồi từ khoá, không emoji trong tiêu đề.

## 5. Kiểm tra và đăng

1. `git pull --rebase origin main`
2. Viết file `content/blog/<slug>.md` (slug không dấu, gạch ngang, chứa từ khoá).
3. `node src/build.mjs` phải chạy không lỗi, có `blog/<slug>/index.html`. Kiểm tra mọi ảnh trong bài tồn tại.
4. **Chỉ commit file bài viết** (không commit file build): `git checkout -- . ':!content/blog'` rồi `git add content/blog/<slug>.md`.
5. Commit "Cẩm nang: <tiêu đề>" và `git push origin main` (thử lại tối đa 4 lần nếu lỗi mạng). GitHub Actions tự build và đăng.

