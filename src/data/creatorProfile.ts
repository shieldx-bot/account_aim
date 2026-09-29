/**
 * Hồ sơ cá nhân của nhà sáng lập — dùng chung cho trang Giới thiệu, Footer và Header.
 * ⚠️ Các trường bên dưới là THÔNG TIN MẪU dựa trên kênh YouTube công khai.
 *    Hãy cập nhật số liệu chính xác (email, Telegram, stats...) trước khi go-live.
 */
export interface CreatorSocial {
  label: string;
  handle: string;
  url: string;
  icon: 'youtube' | 'tiktok' | 'facebook' | 'telegram' | 'email' | 'website';
}

export interface CreatorStat {
  value: string;
  label: string;
}

export const creatorProfile = {
  name: 'Jeff Su',
  role: 'Nhà sáng lập AIPro.dev · Creator & Career Coach',
  tagline:
    'Từ kênh YouTube dạy hàng triệu người dùng thành thạo AI & năng suất số, Jeff xây dựng AIPro.dev để giúp lập trình viên Việt Nam tiếp cận các mô hình AI hàng đầu thế giới với chi phí tối ưu nhất.',
  avatarInitials: 'JS',
  location: 'Toronto, Canada 🇨🇦 · Phục vụ cộng đồng dev toàn cầu 🌍',
  quote:
    '“AI không thay thế bạn — nhưng người biết dùng AI thì có. Sứ mệnh của tôi là thu ngắn khoảng cách đó.”',
  youtubeUrl: 'https://www.youtube.com/@JeffSu',
  stats: [
    { value: '1M+', label: 'Người đăng ký YouTube' },
    { value: '50M+', label: 'Lượt xem tích lũy' },
    { value: '300+', label: 'Video hướng dẫn AI & Năng suất' },
    { value: '12,450+', label: 'Kỹ sư đang sử dụng AIPro.dev' },
  ] as CreatorStat[],
  highlights: [
    'Khách mời trên TEDx, Microsoft Build, Google Cloud Next và Shopify Editions.',
    'Chuyên gia Google Workspace & Microsoft 365 được chứng nhận — từng làm việc tại Deloitte và RBC.',
    'Series “ChatGPT Masterclass” và “AI for Developers” giúp người học ứng dụng LLM vào công việc thực tế.',
    'Toàn bộ gói tài khoản & API Credit trên AIPro.dev đều được Jeff kiểm thử trực tiếp trong các video hướng dẫn.',
  ],
  socials: [
    {
      label: 'YouTube',
      handle: '@JeffSu',
      url: 'https://www.youtube.com/@JeffSu',
      icon: 'youtube',
    },
    {
      label: 'TikTok',
      handle: '@jeffsu',
      url: 'https://www.tiktok.com/@jeffsu',
      icon: 'tiktok',
    },
    {
      label: 'Facebook',
      handle: '/JeffSuOfficial',
      url: 'https://www.facebook.com/JeffSuOfficial',
      icon: 'facebook',
    },
    {
      label: 'Telegram Support',
      handle: '@aipro_support',
      url: 'https://t.me/aipro_support',
      icon: 'telegram',
    },
    {
      label: 'Email hợp tác',
      handle: 'hello@aipro.dev',
      url: 'mailto:hello@aipro.dev',
      icon: 'email',
    },
  ] as CreatorSocial[],
};

export type CreatorProfile = typeof creatorProfile;
