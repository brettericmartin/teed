'use client';

import { useState } from 'react';
import { TikTokEmbed as TikTokEmbedComponent } from 'react-social-media-embed';
import { ExternalLink, Loader2 } from 'lucide-react';

interface TikTokEmbedProps {
  videoId: string;
  originalUrl: string;
}

export default function TikTokEmbed({ videoId, originalUrl }: TikTokEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <a
        href={originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex flex-col items-center justify-center gap-3
          w-full aspect-[9/16] max-w-[325px] mx-auto
          bg-gradient-to-br from-[#25F4EE] via-[#FE2C55] to-[#000000]
          rounded-xl text-white
          hover:opacity-90 transition-opacity
        "
      >
        <svg viewBox="0 0 48 48" className="w-12 h-12 fill-current">
          <path d="M38.0766847,15.8542954 C36.0693906,15.7935177 34.2504839,14.8341149 32.8791434,13.5466056 C32.1316475,12.8317108 31.540171,11.9694126 31.1415066,11.0151329 C30.7426093,10.0603874 30.5765339,9.0199105 30.6064751,7.9771175 L24.422071,7.9771175 L24.3865933,31.3498014 C24.3865933,32.8925351 23.6084046,34.3166482 22.3350881,35.1969556 C21.0620045,36.0775857 19.4240026,36.3106761 17.9480544,35.8237335 C16.4718733,35.336246 15.3097336,34.1750674 14.8197799,32.7002655 C14.3295933,31.2249978 14.5765641,29.5877597 15.4864238,28.325182 C16.3960507,27.0623714 17.8588752,26.3150258 19.4128322,26.3150258 C19.7455313,26.3150258 20.0778649,26.355595 20.4026647,26.4371679 L20.4026647,20.2011283 C19.4161943,20.0673724 18.4160941,20.0619441 17.4283908,20.1844085 C15.8166091,20.3883285 14.2733178,20.9386278 12.8969545,21.7962034 C11.5208241,22.6535462 10.3434933,23.7966134 9.44208563,25.1458795 C7.95901178,27.3847529 7.45270416,30.1189608 8.03229706,32.7348943 C8.61230664,35.3502621 10.2336036,37.6512434 12.5367693,39.0869004 C14.8394691,40.5227902 17.6533802,40.9797669 20.3200433,40.3524882 C22.9867065,39.7249767 25.3091294,38.0596042 26.8127848,35.7154355 C28.3169059,33.3717325 28.8897429,30.5227562 28.4110801,27.7548239 L28.3833919,27.6142547 L28.3833919,18.8467556 C29.2916282,19.4955699 30.2760699,20.0285541 31.3141855,20.4340967 C33.0285052,21.1160343 34.8655472,21.4478537 36.7087255,21.4099711 L36.7087255,15.8542954 C37.1669947,15.8542954 37.6226,15.8542954 38.0766847,15.8542954 Z"/>
        </svg>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>View on TikTok</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </a>
    );
  }

  return (
    <div className="tiktok-embed-wrapper relative flex justify-center">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)] rounded-xl z-10 min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      <TikTokEmbedComponent
        url={originalUrl}
        width={325}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
