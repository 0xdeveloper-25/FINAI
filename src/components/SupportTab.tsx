import { Heart } from 'lucide-react';
import { t } from '../utils';

export default function SupportTab() {
  return (
    <div className="bg-zinc-50 text-zinc-800 p-6 md:p-12 -mx-6 md:-mx-8 -my-6 md:-my-8 min-h-screen flex flex-col justify-between animate-in fade-in duration-500">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 my-auto">
        
        {/* HERO HEADER */}
        <div className="text-center flex flex-col items-center gap-3 w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#113d29] border border-emerald-100 text-xs font-semibold tracking-wide uppercase">
            <Heart className="w-3.5 h-3.5 fill-[#113d29] animate-pulse" />
            <span>{t('Dukung Developer', 'Support Developer')}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#113d29] tracking-tight mt-1">
            {t('Dukung Pengembangan FINAI', 'Support FINAI Development')}
          </h1>
          <p className="font-sans text-sm text-zinc-500 font-medium leading-relaxed max-w-md mt-2">
            {t(
              'Kontribusi Anda sangat berarti untuk membantu kami menjaga kualitas layanan, mengembangkan fitur baru, dan menjaga aplikasi ini tetap bebas dari iklan.',
              'Your contribution is highly meaningful in helping us maintain service quality, develop new features, and keep this application ad-free.'
            )}
          </p>
        </div>

        {/* QR CODE CARD */}
        <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-xs">
          <h3 className="font-display text-lg font-bold text-zinc-900 mb-1">
            {t('Pindai QR Code', 'Scan QR Code')}
          </h3>
          <p className="font-sans text-xs text-zinc-400 font-medium mb-6">
            {t(
              'Pindai menggunakan aplikasi dompet digital atau mobile banking Anda',
              'Scan using your digital wallet or mobile banking application'
            )}
          </p>

          {/* QR CODE WRAPPER */}
          <div className="relative p-4 bg-white border-2 border-[#113d29]/10 rounded-2xl shadow-sm w-full aspect-square max-w-[280px] flex items-center justify-center overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/d/108ARPEK-o0DT1urh7vus-iXY4aOxE2-k"
              alt="Developer Support QR Code"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* DETAILS */}
          <div className="mt-6 flex flex-col gap-1.5 items-center">
            <span className="font-mono text-[10px] font-bold text-zinc-700 uppercase tracking-wider bg-zinc-100 px-3.5 py-1 rounded-full">
              {t('Scan via QRIS / Bank Transfer')}
            </span>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              {t(
                'Terima kasih atas segala bentuk kebaikan dan apresiasi Anda!',
                'Thank you for all forms of kindness and appreciation!'
              )}
            </p>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="w-full max-w-2xl mx-auto mt-12 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shrink-0">
        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs font-medium">
          &ldquo;{t('Financial freedom is available to those who learn about it and work for it.', 'Financial freedom is available to those who learn about it and work for it.')}&rdquo; &mdash; FINAI.
        </p>
        <div className="flex items-center gap-6 text-[11px] text-zinc-400 font-semibold">
          <a href="#" className="hover:text-zinc-600 transition-colors">{t('Privacy Policy')}</a>
          <a href="#" className="hover:text-zinc-600 transition-colors">{t('Terms of Service')}</a>
        </div>
      </div>
    </div>
  );
}
