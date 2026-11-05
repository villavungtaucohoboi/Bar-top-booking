// Nội dung giới thiệu dài cho từng trang bar (SEO). Chỉ dùng dữ liệu thật của bar
// (loại hình, khu vực, địa chỉ, nhạc, giờ, giá, mô tả) cộng lời khuyên chung theo loại hình.
// Không khẳng định chi tiết riêng nào mà dữ liệu không có.
const pick = (arr, seed, off = 0) => arr[(seed + off) % arr.length];

export const TYPE = {
  'Rooftop': {
    label: 'rooftop bar',
    space: [
      'Rooftop là kiểu bar trên tầng cao, nên điểm cộng lớn nhất thường là tầm nhìn. Khoảng chiều tối, lúc trời chuyển từ vàng sang tím, là thời điểm nhiều người chọn lên ngắm thành phố trước khi đèn bật sáng hẳn.',
      'Bar trên cao thường có không gian mở, gió thoáng và nhìn được xa, khác hẳn cảm giác ngồi trong quán kín. Vì vậy chỗ gần lan can hoặc cửa kính hay được chọn trước.',
      'Đi rooftop, bạn thường đến để ngắm cảnh và trò chuyện hơn là nhảy nhót. Nhạc thường ở mức vừa phải để mọi người còn nói chuyện được với nhau.',
    ],
    who: 'cặp đôi, nhóm bạn nhỏ, khách du lịch và những buổi gặp gỡ muốn có view đẹp',
    best: 'khoảng 30–60 phút trước hoàng hôn, để có chỗ đẹp và kịp chụp ảnh',
    tips: ['Mang áo khoác mỏng, trên cao gió thường lạnh hơn dưới phố.', 'Mùa mưa nên hỏi trước quán có khu có mái che không.'],
  },
  'Club': {
    label: 'club',
    space: [
      'Club là nơi đi để nghe nhạc lớn và quẩy cùng đám đông, nên không khí thường lên cao dần về khuya. Khu đứng sát sân khấu sôi động nhất, còn bàn ngồi phù hợp nhóm muốn có chỗ nghỉ chân.',
      'Với kiểu club, âm thanh, ánh sáng và DJ là phần chính của buổi tối. Nhóm đông thường đặt bàn trước để có chỗ để đồ và gọi đồ uống theo chai cho tiện.',
      'Club thường vắng vào đầu tối và đông dần từ khoảng 22h trở đi. Nếu thích quẩy, bạn nên đến vào giờ cao điểm; nếu muốn dễ trò chuyện hơn, hãy đến sớm hơn một chút.',
    ],
    who: 'nhóm bạn trẻ thích nhạc sôi động, tiệc sinh nhật và những buổi muốn quẩy đến khuya',
    best: 'từ khoảng 22h trở đi, khi không khí bắt đầu sôi động',
    tips: ['Bàn VIP hoặc sofa thường có mức chi tối thiểu, hãy hỏi rõ khi đặt bàn.', 'Một số club kiểm tra giấy tờ ở cửa, nên mang theo CCCD.'],
  },
  'Pub': {
    label: 'pub',
    space: [
      'Pub là kiểu quán thoải mái, nhiều bàn chung và đồ uống chia nhau, hợp cho những buổi tụ tập không cần cầu kỳ. Không khí thường rôm rả hơn là sang trọng.',
      'Đến pub, bạn thường gọi bia hoặc đồ uống theo nhóm rồi ngồi lâu trò chuyện. Giá thường dễ chịu hơn rooftop hay club, nên hợp đi đông người.',
      'Pub thường là điểm dừng chân lý tưởng sau bữa tối hoặc sau một ngày dạo phố. Nhiều quán có nhạc sống hoặc chiếu thể thao vào những tối nhất định.',
    ],
    who: 'nhóm bạn, đồng nghiệp, liên hoan nhỏ và những ai thích không khí thoải mái',
    best: 'buổi tối từ 19h đến khuya, đặc biệt tối cuối tuần',
    tips: ['Đi nhóm có thể gọi tháp bia hoặc set đồ uống để tiết kiệm hơn gọi lẻ.', 'Hỏi trước lịch nhạc sống hoặc chiếu thể thao nếu bạn quan tâm.'],
  },
  'Lounge': {
    label: 'lounge',
    space: [
      'Lounge là kiểu quán ngồi thoải mái với ghế êm, ánh sáng dịu và nhạc vừa phải. Bạn đến để ngồi lâu, trò chuyện và nhâm nhi, chứ không phải để nhảy.',
      'Không gian lounge thường được chăm chút về nội thất và ánh sáng, nên hợp cả buổi hẹn hò lẫn gặp gỡ đối tác. Nhạc đủ để tạo không khí nhưng không át tiếng nói chuyện.',
      'Đi lounge, nhiều người chọn ngồi sofa hoặc góc riêng để có không gian yên tĩnh hơn. Đặt trước giúp bạn chọn được vị trí ưng ý.',
    ],
    who: 'cặp đôi, nhóm bạn nhỏ, gặp gỡ đối tác và những buổi tối muốn ngồi lâu, nói chuyện thoải mái',
    best: 'từ chiều tối đến khoảng 22h, khi không gian còn thoáng',
    tips: ['Nên mặc lịch sự (smart casual), nhiều lounge không thích hợp với đồ quá tuỳ tiện.', 'Đặt trước nếu muốn ngồi sofa hoặc góc riêng.'],
  },
  'Cocktail bar': {
    label: 'cocktail bar',
    space: [
      'Cocktail bar tập trung vào quầy pha chế: bartender tư vấn đồ uống theo khẩu vị của bạn. Không gian thường nhỏ, ấm cúng và yên hơn club hay pub.',
      'Đến cocktail bar, bạn có thể ngồi quầy để xem pha chế và trò chuyện với bartender, hoặc chọn bàn nhỏ cho nhóm vài người. Thực đơn thường có cả món cổ điển lẫn signature riêng của quán.',
      'Kiểu quán này hợp với người thích thưởng thức từng ly hơn là uống nhiều. Nếu chưa biết gọi gì, hãy nói với bartender bạn thích vị ngọt, chua hay đắng, nhẹ hay mạnh.',
    ],
    who: 'cặp đôi, nhóm nhỏ 2–4 người, người mới đi bar và những ai thích thưởng thức cocktail',
    best: 'buổi tối từ 19h–21h, khi quầy chưa quá đông và bartender có thời gian tư vấn',
    tips: ['Nói với bartender bạn thích vị gì để được gợi ý đúng khẩu vị.', 'Nhóm đông nên đặt trước, vì cocktail bar thường có ít chỗ ngồi.'],
  },
  'Garden bar': {
    label: 'garden bar',
    space: [
      'Garden bar có không gian ngoài trời, nhiều cây xanh và thoáng, nên cảm giác thư giãn hơn các quán kín. Buổi tối trời mát là lúc dễ chịu nhất để ngồi.',
      'Ngồi ở garden bar, bạn thường được hưởng gió và không khí ngoài trời, hợp tụ tập đông người mà không bị ngột. Đồ uống thường đơn giản, dễ gọi theo nhóm.',
      'Không gian sân vườn hợp ngồi lâu và trò chuyện. Vì ở ngoài trời, thời tiết ảnh hưởng nhiều đến trải nghiệm.',
    ],
    who: 'nhóm bạn, gia đình nhỏ và những buổi tụ tập muốn không gian thoáng, ít ồn',
    best: 'buổi tối khi trời đã dịu, từ khoảng 18h–20h',
    tips: ['Mùa mưa hãy hỏi quán có khu có mái che không.', 'Mang theo kem chống muỗi nếu ngồi ngoài trời lâu.'],
  },
  'Jazz bar': {
    label: 'jazz bar',
    space: [
      'Jazz bar có nhạc sống hoặc nhạc jazz làm nền, không khí chậm và tinh tế hơn quán thường. Bạn đến để nghe nhạc, ngồi gần nhau và thưởng thức đồ uống.',
      'Với kiểu jazz bar, buổi biểu diễn là phần chính của buổi tối, nên giờ bắt đầu quan trọng. Chỗ gần sân khấu nghe rõ nhất nhưng cũng hết trước.',
      'Nhạc jazz hợp với những buổi tối thư thả. Âm lượng thường vừa phải để vẫn trò chuyện được với người ngồi cùng bàn.',
    ],
    who: 'cặp đôi, người yêu nhạc jazz và những buổi gặp gỡ thanh lịch',
    best: 'đến sớm trước giờ biểu diễn để chọn chỗ ngồi tốt',
    tips: ['Gọi tổng đài hỏi giờ biểu diễn trước khi đi, lịch nhạc có thể đổi theo ngày.', 'Đến sớm nếu muốn ngồi gần sân khấu.'],
  },
  'Beach club': {
    label: 'beach club',
    space: [
      'Beach club nằm sát biển, kết hợp ghế nằm, ô dù và đồ uống, nên khung cảnh thường thoải mái, sôi động hơn bar trong phố. Hoàng hôn trên biển là thời điểm nhiều người thích nhất.',
      'Đến beach club, bạn có thể ngồi ngắm biển từ chiều rồi ở lại đến tối. Nhiều nơi có DJ hoặc acoustic vào những ngày nhất định.',
      'Không khí beach club thường thoáng và vui, hợp nhóm bạn đi biển. Thời tiết và sóng gió ảnh hưởng nhiều đến trải nghiệm, nên nên xem dự báo trước khi đi.',
    ],
    who: 'nhóm bạn đi biển, cặp đôi và khách du lịch muốn ngắm hoàng hôn',
    best: 'khoảng 30–60 phút trước hoàng hôn, hoặc buổi tối khi có nhạc',
    tips: ['Mang kem chống nắng, áo khoác mỏng cho buổi tối và kiểm tra thời tiết trước khi đi.', 'Cuối tuần và mùa du lịch rất đông, nên đặt bàn trước.'],
  },
  'Whisky bar': {
    label: 'whisky bar',
    space: [
      'Whisky bar có tủ rượu là tâm điểm: bạn có thể gọi theo ly để thử nhiều loại hoặc chọn chai khi đi nhóm. Không khí thường trầm, ấm và yên.',
      'Đến whisky bar, bạn nên hỏi bartender gợi ý theo khẩu vị, từ vị nhẹ, ngọt đến đậm, khói. Gọi theo ly trước khi mua cả chai sẽ giúp bạn tìm được loại hợp.',
      'Không gian whisky bar thường nhỏ và yên, hợp ngồi trò chuyện và thưởng thức chậm. Nhiều quán còn phục vụ đồ nhắm và xì gà theo quy định.',
    ],
    who: 'người yêu whisky, cặp đôi và những buổi gặp gỡ muốn không gian trầm, kín đáo',
    best: 'buổi tối từ 19h–22h, khi quán còn yên để trò chuyện với bartender',
    tips: ['Hỏi bartender gợi ý theo khẩu vị, và gọi theo ly trước khi mua cả chai.', 'Uống chậm, kèm nước và đồ ăn nhẹ.'],
  },
};

export const COMMON_TIPS = [
  'Đặt bàn trước vào tối thứ 6, thứ 7 và dịp lễ vì chỗ đẹp hết nhanh.',
  'Gọi tổng đài xác nhận giờ mở cửa trước khi đi, giờ có thể đổi theo mùa hoặc sự kiện.',
  'Đi nhóm nên hẹn điểm gặp và giữ điện thoại đủ pin.',
  'Hỏi trước về phí phục vụ và VAT để biết tổng chi phí.',
  'Về bằng taxi hoặc xe công nghệ, không lái xe sau khi uống rượu bia.',
];

const sentences = t => String(t || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);

export function barStory(b, ctx) {
  const { esc, fmt, land, c, href, hotline, bars, P, pk, hk, mapUrl } = ctx;
  const T = TYPE[b.type] || TYPE['Lounge'];
  const seed = b.id;
  const where = [b.addr, b.addr && b.addr.includes(b.area) ? '' : b.area, c.name].filter(Boolean).join(', ');
  const fit = sentences(b.desc).find(s => /hợp|phù hợp|dành cho/i.test(s));
  const sameArea = bars.filter(x => x.city === b.city && x.id !== b.id && x.area === b.area).slice(0, 4);
  const sameType = bars.filter(x => x.city === b.city && x.id !== b.id && x.type === b.type && !sameArea.includes(x)).slice(0, 4);
  const link = x => `<a href="${href(x.path)}">${esc(x.name)}</a>`;

  const tips = [...T.tips, pick(COMMON_TIPS, seed), pick(COMMON_TIPS, seed, 2), COMMON_TIPS[4]]
    .filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);

  const priceNote = pk
    ? `<p>Mức chi tham khảo tại ${esc(b.name)} khoảng <b>${fmt(b.price[0] * 1000)}đ đến ${fmt(b.price[1] * 1000)}đ mỗi người</b> cho 2–3 đồ uống. ${b.priceEst ? 'Đây là ước tính của TopChill theo mặt bằng giá của loại hình này, không phải bảng giá chính thức của quán. ' : ''}Giá thực tế phụ thuộc đồ uống bạn chọn, bàn ngồi và ngày đi, vì vậy bạn nên gọi <a href="tel:${hotline.replace(/\s/g, '')}">${esc(hotline)}</a> để biết thực đơn và phí phục vụ trước khi đến.</p>`
    : `<p>TopChill chưa có bảng giá chính thức của ${esc(b.name)}. Bạn gọi <a href="tel:${hotline.replace(/\s/g, '')}">${esc(hotline)}</a>, tổng đài sẽ hỏi quán và báo lại mức chi cùng chỗ ngồi còn trống.</p>`;

  const html = `
    <h2 style="margin-top:32px">${esc(b.name)} có gì đáng chú ý?</h2>
    <div class="prose">
      <p>${esc(pick(T.space, seed))}</p>
      <p>${esc(b.name)} thuộc nhóm ${esc(T.label)} tại ${esc(b.area)}, ${esc(c.name)}${b.music ? `, với âm nhạc ${esc(b.music.replace(/\.$/, ''))}` : ''}. ${fit ? `Theo mô tả tổng hợp từ các nguồn công khai, ${esc(fit.charAt(0).toLowerCase() + fit.slice(1))}` : ''}</p>
    </div>
    <h2 style="margin-top:28px">${esc(b.name)} phù hợp với ai?</h2>
    <div class="prose"><p>Kiểu ${esc(T.label)} như ${esc(b.name)} thường hợp với ${esc(T.who)}. Nếu bạn đi nhóm đông hoặc có dịp đặc biệt như sinh nhật, hãy báo trước số người khi đặt bàn để tổng đài sắp xếp chỗ ngồi phù hợp.</p></div>
    <h2 style="margin-top:28px">Thời điểm nên đến</h2>
    <div class="prose"><p>Với ${esc(T.label)}, thời điểm thường được chọn là ${esc(T.best)}. ${hk ? `${esc(b.name)} mở cửa ${esc(b.hours)}, tuy nhiên giờ có thể thay đổi theo mùa hoặc sự kiện nên bạn vẫn nên xác nhận trước.` : `Giờ mở cửa của ${esc(b.name)} chưa được xác nhận, bạn gọi ${esc(hotline)} để biết chính xác.`}</p></div>
    <h2 style="margin-top:28px">Mức chi tại ${esc(b.name)}</h2>
    <div class="prose">${priceNote}</div>
    <h2 style="margin-top:28px">Lưu ý khi đi</h2>
    <ul class="story-tips">${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h2 style="margin-top:28px">Địa chỉ và đường đi</h2>
    <div class="prose"><p>${esc(b.name)} ${b.addr ? `ở ${esc(where)}` : `nằm ở khu vực ${esc(b.area)}, ${esc(c.name)}`}. Bạn có thể <a href="${esc(mapUrl)}" target="_blank" rel="noopener">xem đường đi trên Google Maps</a> hoặc báo tổng đài, nhân viên sẽ chỉ đường khi gọi xác nhận bàn.</p>
    ${sameArea.length ? `<p><b>Bar cùng khu vực ${esc(b.area)}:</b> ${sameArea.map(link).join(', ')}.</p>` : ''}
    ${sameType.length ? `<p><b>${esc(b.type)} khác ở ${esc(c.name)}:</b> ${sameType.map(link).join(', ')}.</p>` : ''}
    ${land ? `<p><a href="${href(land.path)}">Xem tất cả ${esc(land.name)} →</a></p>` : ''}</div>
    <h2 style="margin-top:28px">Đặt bàn ${esc(b.name)} qua TopChill</h2>
    <div class="prose"><ol>
      <li>Bấm <b>Đặt bàn</b>, chọn ngày, giờ, số khách và loại bàn.</li>
      <li>Gọi <a href="tel:${hotline.replace(/\s/g, '')}">${esc(hotline)}</a>, nhắn Zalo hoặc Telegram, hoặc để lại số điện thoại.</li>
      <li>Tổng đài xác nhận với quán và giữ bàn cho bạn. Đặt bàn qua TopChill không cần cọc.</li>
    </ol></div>`;

  const extraFaq = [
    { q: `Có cần đặt bàn trước khi đến ${b.name} không?`, a: `Nên đặt trước, nhất là tối thứ 6, thứ 7 và dịp lễ, khi chỗ ngồi đẹp hết nhanh. Bạn gọi ${hotline}, nhắn Zalo hoặc để lại số trên TopChill, tổng đài sẽ giữ bàn và gọi xác nhận, không cần đặt cọc.` },
    { q: `${b.name} phù hợp đi cùng ai?`, a: `Kiểu ${T.label} như ${b.name} thường hợp với ${T.who}.` },
    { q: `Nên đến ${b.name} vào lúc nào?`, a: `Thời điểm thường được chọn là ${T.best}. ${hk ? `Quán mở cửa ${b.hours}, bạn nên xác nhận lại trước khi đi.` : `Gọi ${hotline} để xác nhận giờ mở cửa.`}` },
  ];
  return { html, extraFaq };
}
