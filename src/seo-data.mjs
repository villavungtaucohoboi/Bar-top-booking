// Nội dung SEO riêng cho từng trang thành phố. Viết khác nhau cho mỗi tỉnh để tránh nội dung trùng lặp.
// description: thẻ meta (120–160 ký tự, có từ khóa "bar <tỉnh>")
// intro: đoạn mở đầu dưới H1 · areas: [tên khu vực, mô tả] · tips: kinh nghiệm
export const CITY_SEO = {
  hn: {
    description: 'Bar Hà Nội: rooftop phố cổ, sky bar Hồ Tây, club Tạ Hiện, jazz bar. Xem địa chỉ, giá tham khảo và đặt bàn không cần cọc qua TopChill.',
    intro: 'Từ sky bar nhìn xuống phố cổ, lounge ven Hồ Tây đến club Tạ Hiện và jazz bar trong khách sạn cổ, bar Hà Nội có đủ phong cách cho hẹn hò, tụ tập bạn bè hay quẩy tới khuya.',
    areas: [
      ['Tây Hồ', 'Khu của rooftop và lounge ven hồ. Không khí sang, nhạc deep house và R&B, hợp ngắm hoàng hôn rồi ngồi tới khuya. Nên đặt bàn sát kính trước 19h vào cuối tuần.'],
      ['Phố cổ Hoàn Kiếm', 'Tạ Hiện, Hàng Bạc, Hàng Buồm tập trung club, pub và cocktail bar nhỏ. Đông nhất từ 21h, nhiều bar mở muộn. Đi bộ được giữa các quán nên hợp đi bar tăng hai.'],
      ['Ba Đình, Tràng Tiền', 'Nhiều whisky bar và jazz bar yên tĩnh trong các khách sạn và biệt thự Pháp. Hợp tiếp khách, nói chuyện công việc.'],
    ],
    tips: [
      'Tối thứ 6 và thứ 7, rooftop và sky bar thường kín bàn view trước 20h. Đặt trước ít nhất một ngày.',
      'Đến sớm, khoảng 17h–19h, để chọn được chỗ đẹp trước khi quán đông.',
      'Club phố cổ có thể kiểm tra giấy tờ tuỳ thân ở cửa. Mang theo CCCD.',
      'Mùa đông Hà Nội lạnh, rooftop thường có lò sưởi nhưng vẫn nên mang áo khoác.',
    ],
  },
  sg: {
    description: 'Bar Sài Gòn: rooftop Quận 1, club Bùi Viện, speakeasy, garden bar Thảo Điền. Xem địa chỉ, giá tham khảo và đặt bàn không cần cọc qua TopChill.',
    intro: 'Sài Gòn có nhiều bar bậc nhất cả nước, từ rooftop nhìn sông Sài Gòn, speakeasy giấu trong hẻm đến club phố Tây mở khuya.',
    areas: [
      ['Quận 1 – Nguyễn Huệ, Lê Lợi', 'Trung tâm của rooftop và lounge cao cấp. Dress code smart casual, không dép lê. Giá cao hơn mặt bằng chung nhưng view đẹp nhất thành phố.'],
      ['Bùi Viện – phố Tây', 'Club và pub nối nhau, nhạc EDM, Vinahouse, mở tới sáng. Hợp nhóm đông muốn quẩy.'],
      ['Thảo Điền, Thủ Đức', 'Garden bar, craft beer, cocktail trái cây. Không khí chill, nhiều khách nước ngoài, hợp ngồi tối thứ 6 sau giờ làm.'],
    ],
    tips: [
      'Mưa chiều mùa mưa (tháng 5–11) có thể làm rooftop đóng tầng ngoài. Hỏi bar về khu có mái che khi đặt.',
      'Bùi Viện đông và ồn. Giữ điện thoại, ví cẩn thận và hẹn điểm gặp lại nếu đi nhóm.',
      'Rooftop Quận 1 nhận khách theo dress code. Nam nên mặc giày kín, áo có cổ.',
      'Đi xe công nghệ về sau khi uống. Không lái xe máy.',
    ],
  },
  dn: {
    description: 'Bar Đà Nẵng: beach bar biển Mỹ Khê, rooftop ngắm cầu Rồng, pub An Thượng. Giá tham khảo, kinh nghiệm và đặt bàn không cần cọc qua TopChill.',
    intro: 'Bar Đà Nẵng gắn với biển: beach club Mỹ Khê có pool party cuối tuần, rooftop bên sông Hàn nhìn thẳng cầu Rồng phun lửa. Giá dễ chịu hơn Hà Nội và Sài Gòn.',
    areas: [
      ['Biển Mỹ Khê, Sơn Trà', 'Beach club, hồ bơi vô cực, DJ từ 20h. Hợp đi từ chiều để tắm biển rồi ở lại tiệc tối.'],
      ['Sông Hàn, Hải Châu', 'Rooftop và lounge nhìn cầu Rồng, cầu Tình Yêu. 21h tối thứ 7 và chủ nhật cầu Rồng phun lửa, nên đặt bàn sát kính.'],
    ],
    tips: [
      'Mùa du lịch hè (tháng 5–8) beach club rất đông, nên đặt bàn trước 2–3 ngày.',
      'Mang đồ bơi nếu đi beach club có hồ bơi.',
      'Tháng 10–12 là mùa mưa bão, kiểm tra thời tiết trước khi đặt bàn ngoài trời.',
    ],
  },
  nt: {
    description: 'Bar Nha Trang: lounge, sky bar, beach club dọc đường Trần Phú. Xem địa chỉ, giá tham khảo và đặt bàn bar Nha Trang không cần cọc qua TopChill.',
    intro: 'Bar Nha Trang tập trung dọc đường Trần Phú, nhìn ra biển, nhiều nơi có live band từ 21h. Phù hợp cho nhóm du lịch muốn ngồi chill sau bữa tối.',
    areas: [['Đường Trần Phú, Lộc Thọ', 'Lounge và beach bar sát biển, gió mát cả đêm, nhiều quán phục vụ hải sản nướng kèm đồ uống.']],
    tips: ['Đặt bàn ngoài trời vào mùa khô (tháng 1–8) để ngắm biển đêm.', 'Hỏi lịch live band khi đặt bàn, thường từ 21h.'],
  },
  pq: {
    description: 'Bar Phú Quốc: beach bar ngắm hoàng hôn, sky bar, club khu Dương Đông. Xem địa chỉ, giá tham khảo và đặt bàn bar Phú Quốc không cần cọc.',
    intro: 'Đi bar ở Phú Quốc là đi ngắm hoàng hôn. Các beach bar Bãi Trường, Dương Đông có sunset session từ 17h30 và fire show cuối tuần.',
    areas: [['Bãi Trường, Dương Đông', 'Beach bar trên cát, ghế lười, DJ chơi nhạc house từ lúc mặt trời lặn. Đẹp nhất từ 17h đến 19h.']],
    tips: ['Đến trước 17h để có ghế đầu hàng ngắm hoàng hôn.', 'Mùa khô tháng 11–4 là thời điểm hoàng hôn đẹp và ít mưa nhất.'],
  },
  dl: {
    description: 'Bar Đà Lạt: cocktail bar, pub nhạc sống, quán ấm cúng ngày se lạnh. Xem địa chỉ, giá tham khảo và đặt bàn bar Đà Lạt qua tổng đài TopChill.',
    intro: 'Bar Đà Lạt nhỏ, ấm và yên: lò sưởi, nhạc blues, acoustic, dàn whisky dài. Hợp những tối se lạnh muốn ngồi lâu nói chuyện.',
    areas: [['Trung tâm Phường 1', 'Quanh chợ Đà Lạt và dốc Nhà Làng có nhiều whisky bar, pub và quán acoustic trong nhà gỗ.']],
    tips: ['Đà Lạt về đêm 14–17 độ, mang áo ấm.', 'Bar ở đây thường đóng cửa sớm, khoảng 23h–0h.'],
  },
  hp: {
    description: 'Bar Hải Phòng: pub, beer club, lounge khu Lê Lợi, Ngô Quyền. Xem địa chỉ, giá tham khảo và đặt bàn bar Hải Phòng không cần cọc qua TopChill.',
    intro: 'Bar Hải Phòng mang chất phố cảng: pub chiếu bóng đá màn hình lớn, bia tươi, đồ nướng, hợp hội anh em tụ tập.',
    areas: [['Ngô Quyền, Lê Hồng Phong', 'Pub, beer club và bar thể thao tập trung dọc trục Lê Hồng Phong.']],
    tips: ['Đặt bàn sớm vào tối có trận bóng lớn.', 'Nhiều pub có combo bia và đồ nướng cho nhóm 4–6 người.'],
  },
  vt: {
    description: 'Bar Vũng Tàu: beach bar Bãi Sau, sky bar, beer club. Xem địa chỉ, giá tham khảo và đặt bàn bar Vũng Tàu không cần cọc qua tổng đài TopChill.',
    intro: 'Bar Vũng Tàu giá mềm, ngồi sát biển Bãi Sau, nhiều nơi có acoustic cuối tuần. Hợp nhóm bạn đi biển cuối tuần từ Sài Gòn.',
    areas: [['Bãi Sau – đường Thuỳ Vân', 'Pub và beach bar ngoài trời nhìn ra biển, đông nhất tối thứ 7.']],
    tips: ['Cuối tuần khách Sài Gòn đổ về đông, đặt bàn trước.', 'Kết hợp thuê villa gần biển để đi bộ ra bar, không phải lái xe.'],
  },
  ql: {
    description: 'Bar Hạ Long: club, beach bar, sky bar khu Bãi Cháy. Xem địa chỉ, giá tham khảo và đặt bàn bar Hạ Long không cần cọc qua tổng đài TopChill.',
    intro: 'Bar Hạ Long tập trung ở Bãi Cháy, gần bến du thuyền và khu khách sạn, hợp nhóm du lịch muốn quẩy sau ngày đi vịnh.',
    areas: [['Bãi Cháy', 'Club và bar lớn quanh bến du thuyền và Sun World, nhạc EDM và Vinahouse.']],
    tips: ['Hỏi khách sạn về xe đưa đón về sau 0h.'],
  },
  ct: {
    description: 'Bar Cần Thơ: lounge, pub, club gần bến Ninh Kiều. Xem địa chỉ, giá tham khảo và đặt bàn bar Cần Thơ không cần cọc qua tổng đài TopChill.',
    intro: 'Bar Cần Thơ nằm dọc bến Ninh Kiều, ngồi ngắm sông Hậu về đêm, nhạc R&B và chill.',
    areas: [['Bến Ninh Kiều', 'Lounge và rooftop nhìn ra sông Hậu, cầu đi bộ Ninh Kiều lên đèn đẹp nhất từ 19h.']],
    tips: ['Đặt bàn trước để có chỗ ngồi gần sông vào tối cuối tuần.'],
  },
  hue: {
    description: 'Bar Huế: pub, cocktail bar, bar nhạc sống gần phố Tây Phạm Ngũ Lão. Xem địa chỉ, giá tham khảo và đặt bàn bar Huế qua tổng đài TopChill.',
    intro: 'Bar Huế nhẹ nhàng: sân vườn yên tĩnh, cocktail hương trà, nhạc acoustic. Hợp ngồi chậm sau một ngày đi lăng tẩm.',
    areas: [['Phạm Ngũ Lão, Phú Hội', 'Phố Tây của Huế, nhiều bar sân vườn và pub nhỏ, đi bộ từ khách sạn ven sông Hương.']],
    tips: ['Bar ở Huế đóng cửa khoảng 0h.', 'Thử cocktail pha trà cung đình, đặc sản riêng của bar Huế.'],
  },
  bd: {
    description: 'Bar Bình Dương: pub, lounge, beer club ở Thủ Dầu Một, Thuận An. Xem địa chỉ, giá tham khảo và đặt bàn bar Bình Dương qua tổng đài TopChill.',
    intro: 'Bar Bình Dương tập trung ở Thủ Dầu Một và Thuận An, từ pub kiểu phương Tây đến beer club và lounge cho nhóm bạn sau giờ làm.',
  },
};
