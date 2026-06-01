/**
 * roads-data.js
 * 22 tuyến đường thật tại Hà Nội với tọa độ GPS thực tế
 * Trạng thái giao thông được mô phỏng theo giờ trong ngày
 */

const HANOI_ROADS = [
  {
    id: 1,
    name: "Đại lộ Thăng Long",
    district: "Nam Từ Liêm - Hoài Đức",
    type: "highway",
    lanes: 6,
    length: 29.2,
    maxSpeed: 100,
    coords: [
      [21.0375, 105.7840], [21.0372, 105.7940],
      [21.0369, 105.8100], [21.0366, 105.8260],
      [21.0363, 105.8420], [21.0360, 105.8560]
    ]
  },
  {
    id: 2,
    name: "Cầu Nhật Tân",
    district: "Tây Hồ",
    type: "bridge",
    lanes: 4,
    length: 8.9,
    maxSpeed: 80,
    coords: [
      [21.0860, 105.8290], [21.0855, 105.8335],
      [21.0850, 105.8370], [21.0847, 105.8410],
      [21.0844, 105.8445]
    ]
  },
  {
    id: 3,
    name: "Đường Phạm Văn Đồng",
    district: "Bắc Từ Liêm",
    type: "main",
    lanes: 6,
    length: 5.2,
    maxSpeed: 60,
    coords: [
      [21.0560, 105.8140], [21.0560, 105.8220],
      [21.0559, 105.8310], [21.0558, 105.8400]
    ]
  },
  {
    id: 4,
    name: "Đường Nguyễn Trãi",
    district: "Thanh Xuân - Hà Đông",
    type: "main",
    lanes: 4,
    length: 4.8,
    maxSpeed: 50,
    coords: [
      [21.0285, 105.8285], [21.0220, 105.8240],
      [21.0150, 105.8185], [21.0080, 105.8105],
      [21.0010, 105.8025]
    ]
  },
  {
    id: 5,
    name: "Đường Giải Phóng",
    district: "Hai Bà Trưng - Hoàng Mai",
    type: "main",
    lanes: 4,
    length: 7.5,
    maxSpeed: 50,
    coords: [
      [21.0220, 105.8440], [21.0120, 105.8440],
      [20.9995, 105.8440], [20.9865, 105.8440],
      [20.9740, 105.8440]
    ]
  },
  {
    id: 6,
    name: "Cầu Long Biên",
    district: "Hoàn Kiếm - Long Biên",
    type: "bridge",
    lanes: 2,
    length: 2.4,
    maxSpeed: 40,
    coords: [
      [21.0460, 105.8580], [21.0473, 105.8545],
      [21.0487, 105.8510], [21.0500, 105.8475],
      [21.0512, 105.8443]
    ]
  },
  {
    id: 7,
    name: "Đường Trần Duy Hưng",
    district: "Cầu Giấy",
    type: "main",
    lanes: 4,
    length: 3.1,
    maxSpeed: 50,
    coords: [
      [21.0095, 105.7980], [21.0138, 105.7998],
      [21.0182, 105.8018], [21.0222, 105.8036]
    ]
  },
  {
    id: 8,
    name: "Đường Xuân Thủy",
    district: "Cầu Giấy",
    type: "main",
    lanes: 4,
    length: 2.8,
    maxSpeed: 50,
    coords: [
      [21.0370, 105.7985], [21.0370, 105.8058],
      [21.0369, 105.8132], [21.0368, 105.8200]
    ]
  },
  {
    id: 9,
    name: "Đường Láng - Lê Văn Lương",
    district: "Đống Đa - Thanh Xuân",
    type: "main",
    lanes: 4,
    length: 5.3,
    maxSpeed: 50,
    coords: [
      [21.0190, 105.8245], [21.0238, 105.8200],
      [21.0285, 105.8160], [21.0328, 105.8115],
      [21.0365, 105.8078]
    ]
  },
  {
    id: 10,
    name: "Vành đai 2 (Kim Liên - Trung Hòa)",
    district: "Đống Đa - Cầu Giấy",
    type: "ring",
    lanes: 6,
    length: 8.5,
    maxSpeed: 60,
    coords: [
      [21.0000, 105.8400], [21.0035, 105.8452],
      [21.0075, 105.8498], [21.0115, 105.8530],
      [21.0162, 105.8545], [21.0210, 105.8540]
    ]
  },
  {
    id: 11,
    name: "Đường Bạch Mai",
    district: "Hai Bà Trưng",
    type: "main",
    lanes: 4,
    length: 3.6,
    maxSpeed: 40,
    coords: [
      [21.0000, 105.8480], [21.0052, 105.8479],
      [21.0103, 105.8479], [21.0152, 105.8478]
    ]
  },
  {
    id: 12,
    name: "Cầu Vĩnh Tuy",
    district: "Hai Bà Trưng - Long Biên",
    type: "bridge",
    lanes: 4,
    length: 5.8,
    maxSpeed: 60,
    coords: [
      [21.0062, 105.8808], [21.0076, 105.8768],
      [21.0090, 105.8730], [21.0103, 105.8692]
    ]
  },
  {
    id: 13,
    name: "Đường Nguyễn Văn Cừ",
    district: "Long Biên",
    type: "main",
    lanes: 4,
    length: 4.2,
    maxSpeed: 50,
    coords: [
      [21.0202, 105.8638], [21.0270, 105.8658],
      [21.0338, 105.8678], [21.0400, 105.8698]
    ]
  },
  {
    id: 14,
    name: "Đường Kim Mã",
    district: "Ba Đình",
    type: "main",
    lanes: 4,
    length: 2.2,
    maxSpeed: 40,
    coords: [
      [21.0282, 105.8202], [21.0281, 105.8275],
      [21.0280, 105.8350]
    ]
  },
  {
    id: 15,
    name: "Đinh Tiên Hoàng (Hồ Hoàn Kiếm)",
    district: "Hoàn Kiếm",
    type: "street",
    lanes: 2,
    length: 1.2,
    maxSpeed: 30,
    coords: [
      [21.0285, 105.8500], [21.0308, 105.8510],
      [21.0330, 105.8510], [21.0348, 105.8505]
    ]
  },
  {
    id: 16,
    name: "Vành đai 3 (Thanh Xuân - Mỹ Đình)",
    district: "Thanh Xuân - Nam Từ Liêm",
    type: "ring",
    lanes: 6,
    length: 12.3,
    maxSpeed: 80,
    coords: [
      [20.9872, 105.7905], [20.9871, 105.8058],
      [20.9870, 105.8210], [20.9870, 105.8360],
      [20.9872, 105.8510], [20.9875, 105.8660]
    ]
  },
  {
    id: 17,
    name: "Cầu Thăng Long",
    district: "Từ Liêm - Đông Anh",
    type: "bridge",
    lanes: 4,
    length: 5.5,
    maxSpeed: 80,
    coords: [
      [21.0800, 105.7702], [21.0800, 105.7800],
      [21.0800, 105.7872]
    ]
  },
  {
    id: 18,
    name: "Đường Lê Duẩn - Điện Biên Phủ",
    district: "Hoàn Kiếm - Ba Đình",
    type: "main",
    lanes: 4,
    length: 1.8,
    maxSpeed: 40,
    coords: [
      [21.0218, 105.8432], [21.0248, 105.8432],
      [21.0278, 105.8432]
    ]
  },
  {
    id: 19,
    name: "Đường Trường Chinh",
    district: "Đống Đa - Thanh Xuân",
    type: "main",
    lanes: 4,
    length: 5.0,
    maxSpeed: 50,
    coords: [
      [21.0002, 105.8105], [21.0002, 105.8225],
      [21.0001, 105.8342], [21.0000, 105.8460]
    ]
  },
  {
    id: 20,
    name: "Đường Hoàng Quốc Việt",
    district: "Cầu Giấy - Bắc Từ Liêm",
    type: "main",
    lanes: 4,
    length: 4.5,
    maxSpeed: 50,
    coords: [
      [21.0402, 105.8052], [21.0482, 105.8052],
      [21.0562, 105.8050], [21.0642, 105.8048]
    ]
  },
  {
    id: 21,
    name: "Đại lộ Võ Nguyên Giáp (Nội Bài)",
    district: "Đông Anh - Sóc Sơn",
    type: "highway",
    lanes: 6,
    length: 12.0,
    maxSpeed: 100,
    coords: [
      [21.0802, 105.8142], [21.0902, 105.8142],
      [21.1002, 105.8142], [21.1102, 105.8142],
      [21.1202, 105.8142]
    ]
  },
  {
    id: 22,
    name: "Đường Phạm Hùng",
    district: "Nam Từ Liêm - Cầu Giấy",
    type: "main",
    lanes: 4,
    length: 3.8,
    maxSpeed: 60,
    coords: [
      [21.0288, 105.7802], [21.0220, 105.7835],
      [21.0142, 105.7870], [21.0068, 105.7934]
    ]
  }
];

/**
 * Tính trạng thái giao thông theo giờ (mô phỏng thực tế Hà Nội)
 * Giờ cao điểm sáng: 7h-9h | Giờ cao điểm chiều: 17h-19h
 */
function computeRoadStatus(road, isWeatherBad = false) {
  const now   = new Date();
  const hour  = now.getHours();
  const min   = now.getMinutes();
  const time  = hour + min / 60;
  const isWD  = now.getDay() > 0 && now.getDay() < 6; // Ngày thường

  // Hệ số cơ bản theo loại đường
  const baseLoad = { highway: 0.30, bridge: 0.55, ring: 0.45, main: 0.40, street: 0.35 };
  let load = baseLoad[road.type] || 0.40;

  if (isWD) {
    if (time >= 7.0 && time < 9.5) {
      // Cao điểm sáng - hình chuông tập trung quanh 8h
      load += 0.50 * Math.exp(-0.5 * Math.pow((time - 8.0) / 0.8, 2));
    } else if (time >= 17.0 && time < 20.0) {
      // Cao điểm chiều - hình chuông quanh 18h, kéo dài hơn sáng
      load += 0.55 * Math.exp(-0.5 * Math.pow((time - 18.0) / 1.0, 2));
    } else if (time >= 11.5 && time < 13.5) {
      load += 0.12; // Giờ trưa nhẹ
    }
  } else {
    // Cuối tuần nhẹ hơn
    if (time >= 9 && time < 21) load += 0.10;
  }

  // Cầu và vành đai dễ tắc hơn
  if (road.type === 'bridge') load *= 1.25;
  if (road.type === 'ring')   load *= 1.10;

  // Thời tiết xấu cộng thêm tắc nghẽn đáng kể
  if (isWeatherBad) {
    load += 0.35;
  }

  // Jitter ngẫu nhiên nhỏ (per road, stable giữa các lần gọi)
  const seed = (road.id * 9973 + hour * 113 + Math.floor(min / 5) * 7) % 1000;
  load += (seed / 1000 - 0.5) * 0.18;
  load = Math.max(0.05, Math.min(0.99, load));

  // Map load → status + speed
  let status, speed, density;
  if (load < 0.35) {
    status  = 'clear';
    speed   = Math.round(road.maxSpeed * (0.75 + (1 - load) * 0.25));
    density = Math.round(load * 80);
  } else if (load < 0.60) {
    status  = 'slow';
    speed   = Math.round(road.maxSpeed * (0.40 + (0.60 - load) * 0.8));
    density = Math.round(load * 120);
  } else if (load < 0.82) {
    status  = 'jam';
    speed   = Math.round(road.maxSpeed * (0.15 + (0.82 - load) * 0.5));
    density = Math.round(load * 160);
  } else {
    status  = 'severe';
    speed   = Math.round(road.maxSpeed * 0.08);
    density = Math.round(load * 200);
  }

  // AI prediction: xu hướng 30 phút tiếp theo
  let aiPred;
  const futureTime = time + 0.5;
  const futurePeak = (isWD && ((futureTime >= 7 && futureTime < 9.5) || (futureTime >= 17 && futureTime < 20)));
  if (status === 'clear' && futurePeak)       aiPred = '⚠️ Sắp chậm';
  else if (status === 'slow' && futurePeak)   aiPred = '🔴 Sắp ùn tắc';
  else if (status === 'jam' && !futurePeak)   aiPred = '🟡 Cải thiện dần';
  else if (status === 'severe' && !futurePeak)aiPred = '🟡 Đang giải tỏa';
  else if (status === 'clear')                aiPred = '🟢 Tiếp tục thông';
  else                                        aiPred = '🔴 Duy trì ùn tắc';

  return { status, speed, density, aiPred, load };
}

/** Xây dựng mảng roads với live status */
function buildLiveRoads(isWeatherBad = false) {
  return HANOI_ROADS.map(r => ({
    ...r,
    ...computeRoadStatus(r, isWeatherBad)
  }));
}
