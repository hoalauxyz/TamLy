/** Nhóm theo bối cảnh sống, không theo tên bệnh. Dùng chung cho API seed và chế độ offline. */
export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  openHours: string;
  maxMembers: number;
}

export const DEFAULT_GROUPS: PeerGroup[] = [
  {
    id: 'exam-pressure',
    name: 'Áp lực thi cử & điểm số',
    description: 'Ôn thi, thi lại, sợ kết quả, kỳ vọng của gia đình.',
    openHours: '19:00–22:00 hằng ngày',
    maxMembers: 12,
  },
  {
    id: 'first-year',
    name: 'Năm nhất xa nhà',
    description: 'Lạc lõng, nhớ nhà, chưa có bạn, không biết mình có chọn đúng ngành.',
    openHours: '19:00–22:00 hằng ngày',
    maxMembers: 12,
  },
  {
    id: 'first-job',
    name: 'Đi làm năm đầu',
    description: 'Sếp, đồng nghiệp, cảm giác không đủ giỏi, lương, nghỉ hay ở.',
    openHours: '20:00–22:00 hằng ngày',
    maxMembers: 12,
  },
  {
    id: 'after-graduation',
    name: 'Sau tốt nghiệp: mất phương hướng',
    description: 'Thất nghiệp, so sánh với bạn bè, áp lực "25 tuổi rồi".',
    openHours: '20:00–22:00 hằng ngày',
    maxMembers: 12,
  },
  {
    id: 'sleep-club',
    name: 'Câu lạc bộ ngủ đúng giờ (thử thách 7 ngày)',
    description: 'Cùng nhau đặt lại giấc ngủ. Check-in mỗi sáng.',
    openHours: '07:00–09:00 & 22:00–23:00',
    maxMembers: 20,
  },
];
