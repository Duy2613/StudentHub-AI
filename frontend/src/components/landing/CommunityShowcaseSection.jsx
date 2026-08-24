"use client";

import React from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Heart, 
  ShieldCheck, 
  MapPin, 
  Star, 
  ArrowRight,
  Sparkles,
  Users,
  Home,
  Utensils,
  Building
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";

export default function CommunityShowcaseSection() {
  const samplePosts = [
    {
      id: 1,
      title: "Cảnh báo phòng trọ ảo ép cọc tại ngõ 27 Tạ Quang Bửu (gần ĐHBK Hà Nội)",
      category: "Nhà Trọ",
      location: "Hai Bà Trưng, Hà Nội",
      author: "Nguyễn Minh Quân",
      authorRole: "student",
      trustScore: 82,
      time: "20 phút trước",
      reputableRate: "96%",
      votes: 48,
      likes: 35,
      comment: {
        author: "Luật sư Trần Thu Hà",
        role: "expert",
        badge: "⭐ Chuyên Gia Uy Tín (98 pts)",
        text: "Giao dịch cọc bắt buộc phải có biên nhận ký tên 2 bên và xác minh quyền sở hữu nhà ở của bên cho thuê.",
      },
    },
    {
      id: 2,
      title: "Danh sách 5 quán cơm sinh viên sạch sẽ, chuẩn giá quanh KTX ĐHQG TP.HCM",
      category: "Quán Ăn",
      location: "Thủ Đức, TP.HCM (Làng ĐHQG)",
      author: "Trần Mai Anh",
      authorRole: "student",
      trustScore: 85,
      time: "2 giờ trước",
      reputableRate: "98%",
      votes: 62,
      likes: 88,
      comment: {
        author: "Nguyễn Thảo Vy",
        role: "student",
        badge: "🎓 Sinh Viên Xác Thực",
        text: "Quán cô Năm ở số 3 đường vành đai ngon và đồ ăn sạch sẽ lắm!",
      },
    },
  ];

  return (
    <section className="py-20 relative z-10" id="community">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>05 / Diễn Đàn &amp; Mạng Lưới Xác Thực</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Cộng Đồng Sinh Viên Tương Trợ &amp; Thẩm Định Thực Chứng
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Không gian chia sẻ thực tế về Nhà trọ, Quán ăn, Trường học. Cơ chế Vote Uy Tín giúp đẩy thông tin xác thực lên đầu.
          </p>
        </div>

        {/* Live Forum Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {samplePosts.map((post) => (
            <div
              key={post.id}
              className="p-6 sm:p-8 rounded-3xl bg-space-900/80 hover:bg-space-900/95 border border-white/10 hover:border-purple-500/40 backdrop-blur-2xl transition-all space-y-4 shadow-glass-deep flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {post.category}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-400" /> {post.location}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {post.reputableRate} Uy Tín ({post.votes} votes)
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {post.title}
                </h3>

                {/* Expert Verified Comment */}
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{post.comment.author}</span>
                    <span className="text-[9px] font-bold text-amber-300 px-2 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {post.comment.badge}
                    </span>
                  </div>
                  <p className="text-gray-300 italic text-[11px] leading-relaxed">
                    "{post.comment.text}"
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-teal-300 font-semibold">
                    <ThumbsUp className="w-3.5 h-3.5" /> {post.votes} Uy tín
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-400/30" /> {post.likes} Hữu ích
                  </span>
                </div>

                <Link
                  href="/forum"
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 group"
                >
                  <span>Xem thảo luận</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div>
            <h4 className="text-sm font-bold text-white">Bạn muốn tra cứu thêm danh sách phòng trọ &amp; quán ăn?</h4>
            <p className="text-xs text-gray-400 mt-0.5">Tìm kiếm nhanh theo tên trường hoặc khu vực trên toàn quốc.</p>
          </div>

          <TactileButton variant="primary" size="md" href="/forum" icon={ArrowRight}>
            Truy Cập Diễn Đàn Sinh Viên
          </TactileButton>
        </div>

      </div>
    </section>
  );
}
