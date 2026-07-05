import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { Star } from 'lucide-react'
import { testimonials } from '../../data/mockData'
import 'swiper/css'

export default function Testimonials() {
  return (
    <Swiper
      modules={[Autoplay]}
      spaceBetween={16}
      slidesPerView={1.1}
      autoplay={{ delay: 3500, disableOnInteraction: false }}
      breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3.2 } }}
    >
      {testimonials.map((t) => (
        <SwiperSlide key={t.name}>
          <div className="glass-card p-6 h-full">
            <div className="flex gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-neon-light text-neon-light" />
              ))}
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">"{t.text}"</p>
            <p className="font-semibold text-sm">{t.name}</p>
            <p className="text-xs text-white/40">{t.game}</p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
