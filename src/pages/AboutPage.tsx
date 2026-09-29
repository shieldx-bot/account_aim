import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, BadgeCheck, Sparkles, Zap, CheckCircle2, PlayCircle } from 'lucide-react';
import { creatorProfile } from '@/data/creatorProfile';
import { SocialLinks } from '@/components/common/SocialLinks';
import { trackEvent } from '@/utils/telemetry';

/**
 * Trang "Về chúng tôi" — giới thiệu nhà sáng lập Jeff Su (YouTube @JeffSu)
 * và câu chuyện đứng sau AIPro.dev.
 */
export const AboutPage: React.FC = () => {
  useEffect(() => {
    trackEvent('view_about_page', { creator: creatorProfile.name });
  }, []);

  return (
    <div className="w-full relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-gradient-to-b from-primary-blue/15 via-accent-cyan/5 to-transparent blur-[150px] pointer-events-none -z-10" />

      <section className="max-w-[980px] mx-auto px-4 sm:px-6 pt-12 pb-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-text-muted mb-8 font-mono">
          <Link to="/" className="hover:text-accent-cyan transition-colors">~/</Link>
          <span className="mx-1.5">›</span>
          <span className="text-text-secondary">ve-chung-toi</span>
        </nav>

        {/* Creator Hero Card */}
        <div className="rounded-2xl bg-surface border border-border-subtle p-6 sm:p-10 shadow-[0_0_40px_rgba(0,240,255,0.06)]">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center text-white text-4xl sm:text-5xl font-extrabold shadow-lg shadow-primary-blue/30">
                {creatorProfile.avatarInitials}
              </div>
              <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-status-success text-white border-4 border-surface" title="Nhà sáng lập đã xác thực">
                <BadgeCheck className="w-4 h-4" />
              </span>
            </div>

            {/* Intro */}
            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF4E4E] text-[11px] font-semibold mb-3">
                <Youtube className="w-3.5 h-3.5 fill-[#FF4E4E]" />
                <span className="font-mono">youtube.com/@JeffSu</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                {creatorProfile.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-accent-cyan">{creatorProfile.role}</p>
              <p className="mt-1 text-xs text-text-muted">{creatorProfile.location}</p>
              <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-xl mx-auto sm:mx-0">
                {creatorProfile.tagline}
              </p>

              <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start">
                <a
                  href={creatorProfile.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FF0000]/25"
                >
                  <PlayCircle className="w-4 h-4" />
                  Xem kênh YouTube
                </a>
                <Link
                  to="/api-credit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-elevated hover:bg-surface border border-border-subtle hover:border-accent-cyan/50 text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
                >
                  <Zap className="w-4 h-4 text-accent-cyan" />
                  Khám phá gói API Credit
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {creatorProfile.stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-elevated border border-border-subtle px-4 py-3 text-center">
                <div className="font-mono font-bold text-lg text-accent-cyan">{s.value}</div>
                <div className="text-[11px] text-text-muted mt-0.5 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story + Highlights */}
      <section className="max-w-[980px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl bg-surface border border-border-subtle p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-4">
            <Sparkles className="w-5 h-5 text-primary-blue" />
            Câu chuyện phía sau AIPro.dev
          </h2>
          <blockquote className="border-l-4 border-accent-cyan/60 pl-4 py-1 italic text-sm text-text-secondary mb-5">
            {creatorProfile.quote}
          </blockquote>
          <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
            <p>
              Sau hàng trăm video hướng dẫn cách khai thác ChatGPT, Claude, Gemini và các công cụ AI
              agent cho công việc thực tế, Jeff nhận ra rào cản lớn nhất của người dùng Việt Nam không
              phải là <em>thiếu kiến thức</em>, mà là <strong>khó tiếp cận tài khoản và credit API chính
              hãng</strong> — thanh toán quốc tế, giá USD cao và rủi ro khóa tài khoản.
            </p>
            <p>
              AIPro.dev ra đời để giải quyết đúng bài toán đó: cung cấp sẵn{' '}
              <Link to="/products" className="text-accent-cyan hover:underline">tài khoản AI Pro</Link>{' '}
              và <Link to="/api-credit" className="text-accent-cyan hover:underline">tài khoản API Credit $</Link>{' '}
              từ các nhà cung cấp lớn (OpenAI, Anthropic, Google, DeepSeek…), bàn giao tức thì, bảo hành
              1-đổi-1 tự động và mức giá sỉ theo số lượng.
            </p>
            <p>
              Mọi sản phẩm trước khi lên kệ đều được Jeff trực tiếp kiểm thử trong quá trình sản xuất
              nội dung — những gì anh ấy không dùng được, anh ấy không bán.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-surface border border-border-subtle p-6 sm:p-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">Điểm nổi bật</h2>
          <ul className="space-y-3.5">
            {creatorProfile.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact / Socials */}
      <section className="max-w-[980px] mx-auto px-4 sm:px-6 py-6 pb-12">
        <div className="rounded-2xl bg-surface border border-border-subtle p-6 sm:p-8">
          <h2 className="text-lg font-bold text-text-primary mb-1">Kết nối với Jeff</h2>
          <p className="text-sm text-text-muted mb-5">
            Hợp tác nội dung, tài trợ video hoặc hỗ trợ kỹ thuật doanh nghiệp — liên hệ trực tiếp qua các kênh sau:
          </p>
          <SocialLinks socials={creatorProfile.socials} variant="cards" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
