from pathlib import Path

OUT=Path(__file__).parent

def svg(variant):
    poses={
      'idle': ('M63 224 Q40 228 28 214','M197 224 Q220 228 232 214','M96 246 Q91 270 82 278','M164 246 Q169 270 178 278'),
      'happy': ('M63 218 Q39 205 25 184','M197 218 Q221 205 235 184','M96 246 Q88 267 77 271','M164 246 Q172 267 183 271'),
      'wink': ('M63 222 Q39 230 27 215','M197 222 Q221 230 233 215','M96 246 Q90 269 81 277','M164 246 Q170 269 179 277'),
      'surprised': ('M63 226 Q39 232 28 220','M197 226 Q221 232 232 220','M96 246 Q92 269 83 276','M164 246 Q168 269 177 276'),
      'jump': ('M63 205 Q30 190 22 163','M197 205 Q230 190 238 163','M96 242 Q72 252 64 266','M164 242 Q188 252 196 266'),
      'celebrate': ('M63 214 Q32 182 20 150','M197 214 Q228 182 240 150','M96 244 Q84 269 70 274','M164 244 Q176 269 190 274'),
      'pick': ('M63 222 Q35 220 22 201','M197 220 Q226 199 236 176','M96 246 Q90 270 79 277','M164 246 Q170 270 181 277'),
    }
    larm,rarm,lleg,rleg=poses[variant]
    eyeL='M89 145 Q99 136 109 145' if variant=='wink' else 'circle'
    mouth={
      'idle':'M105 177 Q130 194 155 177',
      'happy':'M103 173 Q130 205 157 173',
      'wink':'M106 177 Q130 195 154 177',
      'surprised':'circle',
      'jump':'M103 171 Q130 205 157 171',
      'celebrate':'M101 171 Q130 208 159 171',
      'pick':'M103 176 Q130 198 157 176',
    }[variant]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="280" height="300" viewBox="0 0 260 290">
<defs>
 <linearGradient id="berry" x1=".15" y1="0" x2=".85" y2="1"><stop stop-color="#ff6f7f"/><stop offset=".45" stop-color="#f43d5d"/><stop offset="1" stop-color="#c91e4b"/></linearGradient>
 <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9fe26b"/><stop offset="1" stop-color="#39a94f"/></linearGradient>
 <radialGradient id="shine"><stop stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="130" cy="276" rx="64" ry="10" fill="#6f2b43" opacity=".12"/>
<path d="M130 48 C92 44 54 75 52 132 C50 190 89 235 130 248 C171 235 210 190 208 132 C206 75 168 44 130 48Z" fill="url(#berry)" stroke="#a91e45" stroke-width="7"/>
<path d="M130 56 C108 42 79 51 60 77 C80 77 94 86 104 100 C112 82 122 69 130 56Z" fill="url(#leaf)" stroke="#348b48" stroke-width="5"/>
<path d="M130 56 C152 42 181 51 200 77 C180 77 166 86 156 100 C148 82 138 69 130 56Z" fill="url(#leaf)" stroke="#348b48" stroke-width="5"/>
<path d="M130 56 Q130 75 130 98" fill="none" stroke="#4b9d50" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="88" cy="95" rx="28" ry="43" fill="url(#shine)" opacity=".6"/>
<g fill="#ffeab0" stroke="#f1c46d" stroke-width="2">
 <ellipse cx="92" cy="129" rx="5" ry="9"/><ellipse cx="130" cy="118" rx="5" ry="9"/><ellipse cx="166" cy="129" rx="5" ry="9"/>
 <ellipse cx="78" cy="160" rx="5" ry="9"/><ellipse cx="112" cy="153" rx="5" ry="9"/><ellipse cx="149" cy="156" rx="5" ry="9"/><ellipse cx="181" cy="163" rx="5" ry="9"/>
 <ellipse cx="96" cy="191" rx="5" ry="9"/><ellipse cx="130" cy="184" rx="5" ry="9"/><ellipse cx="165" cy="192" rx="5" ry="9"/>
</g>
<g fill="#4b1c30">
 {('<circle cx="96" cy="143" r="12"/><circle cx="164" cy="143" r="12"/>' if eyeL=='circle' else '<path d="M87 143 Q97 134 107 143" fill="none" stroke="#4b1c30" stroke-width="7" stroke-linecap="round"/><circle cx="164" cy="143" r="12"/>')}
</g>
<circle cx="92" cy="158" r="5" fill="#ff9baa" opacity=".8"/><circle cx="168" cy="158" r="5" fill="#ff9baa" opacity=".8"/>
<g stroke="#2d1422" stroke-width="6" stroke-linecap="round" fill="none">
 {('<path d="M108 178 Q130 198 152 178"/>' if mouth!='circle' else '')}
</g>
{('<ellipse cx="130" cy="180" rx="12" ry="16" fill="#4b1c30"/>' if mouth=='circle' else '')}
<path d="{larm}" fill="none" stroke="#20101a" stroke-width="7" stroke-linecap="round"/>
<path d="{rarm}" fill="none" stroke="#20101a" stroke-width="7" stroke-linecap="round"/>
<circle cx="28" cy="214" r="7" fill="#20101a"/><circle cx="232" cy="214" r="7" fill="#20101a"/>
<path d="{lleg}" fill="none" stroke="#20101a" stroke-width="7" stroke-linecap="round"/>
<path d="{rleg}" fill="none" stroke="#20101a" stroke-width="7" stroke-linecap="round"/>
</svg>'''

for v in ['idle','happy','wink','surprised','jump','celebrate','pick']:
    (OUT/f'strawberry-{v}.svg').write_text(svg(v), encoding='utf-8')
