# NOIR — master prompt cho Claude Code

## Cách dùng

Mở Claude Code tại thư mục gốc repo `noir`, đính kèm lại **ba ảnh trong yêu cầu này** (đặc biệt là ảnh 3 làm nguồn logo), rồi dán toàn bộ phần từ `MASTER PROMPT — BEGIN` đến `MASTER PROMPT — END`. Nếu Claude Code đọc được file này trực tiếp, có thể dùng lệnh ngắn:

```text
Read prompt/NOIR_CLAUDE_MASTER_PROMPT.md in full and execute the MASTER PROMPT. The three user screenshots are attached: image 1 = broken homepage state, image 2 = intended clean framing of the water section, image 3 = the new NOIR logo reference. Implement, test, and visually verify the finished local app; do not stop after writing a plan.
```

---

# MASTER PROMPT — BEGIN

Bạn là lead frontend engineer, creative developer về WebGL/3D, motion designer và người chịu trách nhiệm QA hình ảnh cho repo hiện tại. Hãy **triển khai hoàn chỉnh** việc chuyển bản clone Nordå thành website portfolio/studio **NOIR** nhận dự án về website, ứng dụng và hạ tầng cloud. Đây là yêu cầu sửa code và kiểm chứng sản phẩm đang chạy, không phải yêu cầu chỉ lên kế hoạch, viết proposal hay tạo mockup.

## 0. Ý định và thứ tự ưu tiên

1. **Sửa lỗi thật**: Khi đi từ route khác về homepage hoặc bấm Home/logo, khu vực media giữa trang có thể hiện trạng thái như **ảnh 1**: chữ trắng khổng lồ tràn ra ngoài khung, chồng lên video và bị cắt. **Ảnh 2** chỉ rõ trạng thái bố cục sạch cần đạt ở chính khu vực đó: media hình chữ nhật có khoảng trắng bên ngoài trong bản cũ và logo đặt giữa. Trong NOIR, thay nền trắng bằng hệ màu đen, giữ nguyên ý đồ một khung media sạch, chữ không đè sai thời điểm. Tìm và sửa nguyên nhân gốc, kể cả race condition khi route transition, restore scroll, font load, resize, `sticky`, `FitText`, `z-index` hoặc timeline scroll.
2. **Nhận diện NOIR trên mọi route**: nền chủ đạo đen/near-black, chữ trắng/ngà, sắc xám có chủ đích. Thay toàn bộ logo/wordmark/favicons/OG và mọi chỗ hiển thị thương hiệu Nordå bằng NOIR. **Ảnh 3** là logo chuẩn được người dùng đưa: một hình hoa/burst trừu tượng màu trắng, mờ hạt và phát sáng tinh tế trên nền đen. Dùng ảnh gốc đính kèm làm nguồn thị giác; giữ đúng silhouette, tỉ lệ, độ mềm, tâm sáng và chất nhiễu. Làm phiên bản trong suốt/sáng/tối, kích thước nhỏ và lớn; kiểm tra bằng mắt ở header, hero, menu, footer, media, favicon. Không dùng lại logo hai hàng sóng Nordå, không biến ảnh 3 thành một bông hoa vector sắc cạnh không giống mẫu.
3. **Đổi nội dung và hành trình kinh doanh**: NOIR là studio/cá nhân nhận dự án liên quan tới code: website, web app, frontend/backend, cloud infrastructure, DevOps, automation, tích hợp API và những giải pháp phần mềm phù hợp. Không còn lời giới thiệu, dịch vụ, dự án, team, tuyển dụng, giải thưởng, testimonial hay hình ảnh kiến trúc giả danh NOIR. Đừng bịa khách hàng, số năm kinh nghiệm, giải thưởng, chứng chỉ, case study hoặc lời chứng thực. Nếu thiếu dữ kiện cá nhân thật, viết copy trung tính và đặt các mục có thể biên tập trong một data file, không đưa placeholder kiểu “Lorem ipsum” ra UI.
4. **Intro đầu trang khi cuộn**: nghiên cứu trực tiếp `https://eventide.framer.ai/`, đặc biệt viewport đầu, cảnh hố đen/đĩa bồi tụ và hành trình cuộn như “cross the horizon”. Lấy đó làm **tham chiếu về độ chân thực, bố cục không gian, ánh sáng, chiều sâu, tốc độ zoom, chuyển cảnh và cách scroll điều khiển thời gian**; dựng một phiên bản nguyên bản cho NOIR, không sao chép thương hiệu, chữ, nút, dashboard hoặc toàn bộ trang Eventide. Người dùng muốn 3D thật và realistic: chỉ phóng to một ảnh tĩnh bằng CSS không đáp ứng yêu cầu.
5. **Thay section nước ở giữa trang**: tham chiếu video `https://www.youtube.com/watch?v=784dsKVrdjQ` — “Interstellar Gargantua Black Hole | 1 Hour Full HD Live Wallpaper” — để dựng lại chân trời sự kiện/đĩa bồi tụ. Đây là **tham chiếu thị giác và chuyển động**, không mặc định là quyền tải lại hoặc phát lại clip có bản quyền. Cảnh cần có tâm đen không phát sáng, đĩa sáng trắng/vàng/cam đi ngang, ánh sáng bị bẻ cong lên và xuống quanh tâm, các vệt vật chất mảnh, tương phản sâu và chuyển động chậm có chiều sâu. Duy trì vị trí và nhịp xuất hiện của section theo page scroll, nhưng thay toàn bộ nước và wave mark bằng hố đen/NOIR mark. Không nhúng YouTube player vào khung làm hero; không hotlink media từ nguồn.

Ưu tiên nếu có xung đột: yêu cầu NOIR của người dùng > copy/layout Nordå cũ > mặc định của skill clone. Được phép sửa route `/` và các route hiện có vì đây là yêu cầu chuyển đổi chính repo này. Đừng tạo một app thứ hai hoặc route demo tách biệt rồi bỏ site cũ nguyên trạng.

## 1. Preflight bắt buộc trước khi sửa

- Đọc `CLAUDE.md`, `AGENTS.md`, `docs/research/INSPECTION_GUIDE.md` và `.claude/skills/clone-website/SKILL.md` từ đầu đến cuối. Áp dụng quy trình **inspect → spec → build → visual diff → fix** của skill cho các phần tham chiếu, nhưng phạm vi là *biến đổi app đang có*, không clone thêm một website Eventide độc lập.
- Đọc `package.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, toàn bộ `src/app/**/page.tsx`, `src/components/sites/norda-framer-website-3f1ea7cb/`, `src/styles/sites/norda-framer-website-3f1ea7cb/`, `src/data/sites/norda-framer-website-3f1ea7cb/`, `src/lib/sites/norda-framer-website-3f1ea7cb/`, `src/hooks/sites/norda-framer-website-3f1ea7cb/`, `tests/` và các asset liên quan. Đọc tài liệu Next.js **đang cài** trong `node_modules/next/dist/docs/` trước khi viết code theo `AGENTS.md`; Next 16 trong repo có thay đổi so với kiến thức chung.
- Ghi `git status` trước khi sửa, tôn trọng những thay đổi đã có, không `reset`/xoá hàng loạt. Chạy baseline `npm run check` hoặc ít nhất lint/typecheck/build và ghi nhận lỗi có sẵn.
- Nếu dùng Claude Code agent teams, tuân theo `AGENTS.md`: mỗi teammate làm ở worktree/branch riêng, phân quyền sở hữu file rõ, merge và xử lý conflict. Nếu không có agent teams, làm tuần tự. Đừng để nhiều agent cùng ghi `layout.tsx`, global CSS, logo hay route root.
- Mở trang local đang chạy và tái hiện lỗi ảnh 1 **trước khi sửa**: mở `/`, đi `/projects` hoặc `/about`, bấm Home/logo về `/`, cuộn qua section media, dùng browser Back/Forward, reload tại vị trí scroll, thử resize. Chụp hình và ghi chính xác điều kiện gây lỗi. Badge “1 Issue” trong ảnh cũng phải được điều tra; đọc lỗi thật, sửa nếu thuộc app, không giấu badge bằng CSS.

### Các điểm xuất phát đã thấy trong repo (xác minh lại, không coi là kết luận nguyên nhân)

| Khu vực | File hiện tại | Điều cần kiểm tra |
| --- | --- | --- |
| Trang chủ/section order | `src/app/page.tsx` | `HomeHero → AboutSection → VideoAwards → Services…` và marker reveal của chrome |
| Hero slideshow nước | `src/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/HomeHero.tsx`, `hero.module.css` | slider, parallax, wordmark ảnh cũ, logo wave |
| Section media lỗi | `.../root-8a5edab2/VideoAwards.tsx`, `video-awards.module.css` | video nước, `WaveMark`, `FitText`, 4 layer `flow/video/logo/text`, sticky, CSS variable `--nd-video-p`, `spacer: 250vh` |
| Brand mark cũ | `.../shared/icons.tsx` | `LogoMark` và `WaveMark` là hai biến thể sóng Nordå |
| Header/menu | `.../shared/SiteChrome.tsx`, `chrome.module.css` | logo, link Home, reveal state sau route change |
| Footer | `.../shared/SiteFooter.tsx` | wordmark cũ, sitemap, copy, back to top |
| Nội dung | `src/data/sites/norda-framer-website-3f1ea7cb/*.ts` | text kiến trúc, project, services, team, jobs, awards, testimonials |
| SEO/metadata | `src/app/layout.tsx`, `public/sites/norda-framer-website-3f1ea7cb/shared/seo/` | title, description, favicon, OG, font |

Với section lỗi, đừng kết luận ngay rằng `z-index` là nguyên nhân. Đo layout thực tế và timeline: `getBoundingClientRect`, computed `position`, `overflow`, `transform`, `opacity`, `z-index`, kích thước SVG `FitText`, font trước/sau load, scrollY, viewport, trạng thái sau client navigation. Xem console và hydration warnings. Sau khi sửa phải kiểm tra cả chiều cuộn xuống và lên, đường dẫn về Home từ mọi route chính, wheel/touchpad và tốc độ cuộn nhanh.

## 2. Nghiên cứu tham chiếu theo skill `clone-website`

### Eventide — chỉ nghiên cứu phần mở đầu liên quan

- Mở `https://eventide.framer.ai/` trong browser automation, viewport ít nhất 1440×900, 1024×768, 390×844. Chụp 0%, 10%, 25%, 50%, 75%, 100% của **đoạn intro scroll**, thêm frame ở mỗi biến cố quan trọng; ghi số px scroll và thời gian/chuyển động. Dùng video capture nếu trình duyệt hỗ trợ. Đừng chỉ chụp đầu và cuối.
- Ở đầu trang, ghi kích thước/phân vùng của black hole, tỉ lệ tâm đen/đĩa sáng, ellipse và vị trí tâm, texture, halo/bloom, màu, particle/noise, typography, metric bên phải, nút scroll. Xác minh cách scene được dựng: canvas/WebGL, video, image sequence, CSS layers hay sự kết hợp. Kiểm tra DOM/media/network/performance; một ảnh `<img>` trong DOM không chứng minh hiệu ứng scroll chỉ là ảnh đó. Đừng đoán engine từ screenshot.
- Khi scroll, ghi camera path, scale, thay đổi trường nhìn, orientation, độ kéo giãn quầng sáng, điểm hố đen chiếm viewport và chuyển cảnh sau khi vượt horizon. Phân biệt chuyển động liên tục theo scroll và auto animation theo thời gian. Trở lại scroll trước và xác nhận có đảo ngược đúng không.
- Lưu research có kiểm chứng trong `docs/research/noir/` và screenshot/video QA trong `docs/design-references/noir/`: `REFERENCE_EVENTIDE.md`, `SCROLL_TIMELINE.md`, `VISUAL_TOKENS.md`, `MEDIA_PROVENANCE.md`. Mỗi số liệu gắn viewport/scroll position; nếu không thể đo, ghi “ước lượng” thay vì gọi là exact.
- Chỉ mượn **ngôn ngữ hình ảnh/nhịp chuyển cảnh** của Eventide cho NOIR. Nội dung intro phải nói về NOIR và năng lực code/cloud, không chép “Every agent. One gravity.”, logo, tên hoặc các phần về AI agent của Eventide.

### Video Gargantua — nghiên cứu frame và provenance

- Mở đúng `https://www.youtube.com/watch?v=784dsKVrdjQ`; ghi tên/nguồn, các timestamp tối thiểu 0:00, 0:15, 0:45, 1:30 và vài mốc xa hơn nếu hình thay đổi. Chụp frame tham chiếu để phân tích nhưng không đặt ảnh chụp player làm production asset. Quan sát thực tế: tâm đen, góc nghiêng đĩa bồi tụ, đường ánh sáng lensed qua cực trên/dưới, nhiệt màu, glow, vật chất, chuyển động.
- Nếu người dùng/owner có file video gốc và quyền dùng, có thể tối ưu clip local thành MP4/WebM theo yêu cầu. Nếu không, tái dựng scene bằng code/render/asset nguyên bản được phép sử dụng. Không dùng `youtube-dl` hoặc CDN/YouTube trực tiếp làm nguồn runtime; không gắn nhạc phim vào site khi chưa có quyền.
- Hình trong **ảnh 3 logo NOIR** được cung cấp bởi người dùng; nếu môi trường Claude Code không truy cập được ảnh đính kèm, tìm asset gốc trong repo trước. Chỉ hỏi người dùng gửi file khi không có nguồn đủ để làm logo đúng. Tiếp tục mọi phần độc lập trong lúc chờ. Đừng giả vờ đã có đường dẫn file ảnh.

## 3. Thiết kế NOIR: hệ thống màu, logo, typography

- Tạo design tokens thống nhất: đen thật hoặc gần đen làm nền chính; xám than làm bề mặt phụ; trắng/ngà cho nội dung; xám trung tính cho caption/border. Ánh cam/vàng của đĩa bồi tụ là **ánh sáng trong media**, không biến toàn site thành giao diện cam. Không còn section nền trắng lớn như ảnh 2; ảnh 2 chỉ là mẫu *bố cục không lỗi*.
- Chuyển menu, footer, form, accordion, card, hover, focus, loading, modal/drawer, 404, trang detail sang cùng hệ đen. Đảm bảo chữ đọc được, control có focus visible, input/CTA nổi rõ. Không đảo màu ảnh một cách thô bạo rồi để các ảnh kiến trúc vẫn làm nội dung chính.
- Dùng logo ảnh 3 làm source-of-truth. Tạo một component brand duy nhất có variant `mark`, `wordmark`/lockup nếu cần và size phù hợp. Chữ “NOIR” có thể là logotype typography riêng, nhưng không được thay hoa sáng của ảnh 3 bằng chữ NOIR ở mọi nơi. Khi logo ở kích thước nhỏ không đủ nhìn chi tiết, tạo bản đơn giản hóa **từ đúng hình**; không tự phát minh biểu tượng khác. Giữ `alt`/accessible name “NOIR” cho link, `aria-hidden` cho bản trang trí. Logo ở media không làm che tâm hố đen quá mức; thử phương án đặt giữa ở một mốc scroll như ảnh 2 rồi nhường scene khi zoom.
- Thay `src/app/layout.tsx` metadata, favicon/apple icon/OG, tên trang, title ở mỗi route, aria labels, hình OG và text copyright. Tìm `Nordå`, `Norda`, `NORDÅ`, `architect`, `architecture`, `interior`, `urban`, tên project/nhân vật cũ cả trong data, mã nguồn hiển thị, alt, footer, form, structured metadata. Không cần đổi tên mọi thư mục nội bộ chỉ để mỹ quan nếu gây rủi ro; nhưng UI/runtime tuyệt đối không lộ brand cũ.
- Chọn typography có chủ đích cho studio công nghệ cao cấp: display rõ, nghiêm, tracking chính xác; body đủ đọc; mono chỉ cho nhãn kỹ thuật/coordinate nếu dùng. Có thể giữ font hiện có nếu hợp mood và local, hoặc đổi font local hợp hơn. Ghi giá trị cụ thể trong tokens, test font load để không đổi layout bất ngờ.

## 4. Thông điệp, cấu trúc nội dung và route

Đề xuất nội dung có thể biên tập, viết tự nhiên bằng tiếng Anh hoặc tiếng Việt **thống nhất trên toàn site**. Nếu repo hiện tiếng Anh và người dùng chưa yêu cầu ngôn ngữ cụ thể, ưu tiên tiếng Anh cho UI, nhưng giữ prompt/ghi chú bằng tiếng Việt. Không dùng thành tích giả. Tinh thần copy: tinh giản, kỹ thuật, tin cậy, có lời mời thảo luận dự án. Ví dụ hướng đi, được quyền viết hay hơn:

- Hero: `NOIR` + câu định vị kiểu “Digital experiences. Built with depth.”; CTA `Start a project` và `Explore work`.
- Dịch vụ: Web Experiences, Web Applications, Cloud & Infrastructure, Integrations & Automation, Technical Direction. Mô tả phạm vi thực thi thực tế: design-to-code, performance, API, deployment, observability, security fundamentals; không cam kết quá mức.
- Quy trình: Discover → Architect → Build → Launch → Evolve, thay quy trình thiết kế/thi công nhà.
- Contact: form thu thập tên/email/loại dự án/mô tả/ngân sách tùy chọn; nếu không có backend/email được kết nối, hiển thị trạng thái trung thực, cung cấp email hoặc mailto thật **chỉ nếu đã có trong repo/user**, không giả báo “đã gửi”.
- Work/project: kiểm kê các dự án thật đã có của NOIR. Nếu chưa có, tránh gắn ảnh nhà cũ với case study code giả. Tạo section “Capabilities/Selected experiments” dựa trên demo thật trong code hoặc thiết kế editorial không bịa client; route dự án cũ phải được viết lại, ẩn khỏi nav, hoặc chuyển hướng có chủ đích, không để nội dung kiến trúc còn truy cập được.
- About/team/news/jobs/awards/partners/testimonials: đánh giá từng route. Giữ những route có thông tin đúng về NOIR; tái biên tập hoặc bỏ khỏi điều hướng những phần không có dữ liệu xác thực. Không tạo logo đối tác giả, quote giả, award giả, counter giả. Nếu thay route, giữ link nội bộ không gãy và quyết định redirect/404 rõ ràng. Privacy policy phải phản ánh form/analytics thực sự có.

Trước khi code nội dung, lập bảng route cũ → hành vi mới trong `docs/research/noir/ROUTE_CONTENT_MAP.md`. Ít nhất kiểm tra `/`, `/projects`, `/about`, `/contact`, `/news`, các detail route hiện hữu, `/privacy-policy` và 404. Không bỏ qua footer/sitemap hoặc metadata của trang con.

## 5. Hero mở đầu: 3D photoreal theo scroll

- Cảnh đầu tiên ở `/` là một không gian đen sâu, black hole trung tâm với accretion disk tạo chiều sâu, ánh sáng cong quanh horizon; bố cục chủ đích cùng loại trải nghiệm Eventide nhưng nhận diện NOIR. Hero cần đẹp ở frame đứng yên **và** khi cuộn. Nền không được trở lại slideshow nước/Nordå.
- Dựng cảnh có chiều sâu thực bằng WebGL/Three.js/React Three Fiber hoặc shader/canvas có mô hình camera và layer vật chất rõ ràng. Chọn kỹ thuật sau khi nghiên cứu và benchmark trên thiết bị mục tiêu. Không bắt buộc dùng thư viện chỉ vì tên nó có “3D”; yêu cầu là hình ảnh và tương tác thật. Có thể kết hợp renderer 3D với texture/video/sequence **nguyên bản và có quyền** để đạt fidelity, nhưng scene không được chỉ là một bitmap phóng to.
- Thành phần hình ảnh cần được giải quyết riêng: vùng event horizon đen tuyệt đối; photon ring mảnh; đĩa bồi tụ ở góc phối cảnh có front/back; phần phía sau bị gravitational lensing kéo lên trên như vòm; phần đĩa trước cắt ngang tâm; ánh vàng trắng ở vùng nóng, cam nâu ở xa, highlight không cháy toàn vùng; grain/particle/tia mảnh tinh tế; bloom được kiểm soát; nền đen sâu và ít sao. Cân nhắc color management, tone mapping, DPR, anti-aliasing, banding và crop mobile.
- Dùng một **scroll progress chuẩn hóa 0→1** cho toàn hành trình intro. Viết timeline trong `SCROLL_TIMELINE.md` với keyframe thực tế đo từ Eventide rồi điều chỉnh cho NOIR: 0 = thiết lập cảnh + NOIR/CTA; khoảng đầu = đĩa chuyển động rất nhẹ/camera bắt đầu tiến; giữa = đẩy camera tới photon ring, hình lấp nhiều màn; cuối = vượt qua tâm tối/chuyển sang section tiếp theo. Các chữ và CTA phải rời/hiện theo đúng timeline, không chồng scene hoặc bị cắt. Đường scroll xuống/up phải reversible, không jump khi wheel nhanh hoặc bấm Home.
- `requestAnimationFrame`/render loop chỉ hoạt động khi cần; tách trạng thái scroll khỏi React render mỗi frame. Chặn memory leak, dispose geometry/material/texture khi unmount, xử lý `ResizeObserver`, DPR cap, context loss, visibility pause. Nếu GPU yếu/WebGL unavailable, có fallback local media hoặc render tĩnh **cùng bố cục**, không màn hình đen trống. `prefers-reduced-motion`: cảnh tĩnh chất lượng cao, nội dung và CTA truy cập được; không khóa scroll.
- Không để fixed canvas che click/focus/menu. Thiết kế layer và stacking context rõ ràng. Dùng một scroll container chuẩn; tránh nested scroll gây lệch timeline hoặc back/forward restore. Mọi text thật nằm trong DOM, selectable, semantic.

## 6. Section nước cũ → black hole cinematic frame

- Xem `VideoAwards.tsx` như section cần **tái kiến trúc**, không chỉ đổi `src` video. Ảnh 2 cho bố cục đích tại đoạn đầu section: một frame media nằm trong nền trang với khoảng trống có chủ ý, NOIR mark cân giữa trong một trạng thái. Với theme mới, vùng ngoài frame đen/near-black, frame có ranh giới qua màu/ánh sáng/chuyển động chứ không cần viền trắng. Section phải luôn sạch khi load và khi quay lại homepage.
- Media tái dựng theo video Gargantua: black hole lớn nhưng crop đẹp trong frame; horizon không bị logo che hoàn toàn; vệt sáng cong ở nửa trên và phản chiếu/vệt quanh nửa dưới; dải vật chất phía trước kéo ngang với motion chậm. Phân biệt với hero Eventide: hero là hành trình camera tiến vào; section này là *cinematic study* riêng, có thể là góc nhìn nghiêng và loop chậm như video.
- Giữ **cảm giác nhịp scroll** của page hiện tại nếu hợp NOIR: framed media xuất hiện → mở rộng/zoom → logo biến đổi đúng lúc → một statement về code/cloud đi vào/ra → section tiếp theo phủ lên có chủ đích. Tuy nhiên sửa toàn bộ phép tính khiến chữ tràn như ảnh 1. Statement mới phải ngắn, đúng lĩnh vực, có line breaks responsive và khoảng an toàn; không dùng câu “Crafting spaces…” hay `WaveMark`. Không cần giữ `250vh`, `99%`, hệ số scale `0.66→1` hoặc viewBox cũ nếu chúng gây bug; đo lại từng mốc.
- Định nghĩa rõ state machine/timeline: `pre-enter`, `framed`, `expanding`, `statement`, `exit`. Mỗi state có rule cho frame rect, video/canvas crop, logo opacity/scale, text opacity/transform, panel overlay và pointer events. Ở mọi mốc, text phải nằm trong vùng an toàn, không nằm sau/lọt khỏi clip do transform cha, không đụng fixed header. Dù người dùng cuộn rất nhanh, refresh giữa section, bấm Back, resize hoặc font swap, state phải suy ra từ vị trí thật thay vì trông chờ animation đã chạy trước.
- Nếu giữ `FitText`, phải chứng minh bounding box của SVG/text đúng với container sau font load và resize. Nếu không, thay bằng text HTML responsive hoặc SVG layout mới dễ kiểm soát. Tránh `overflow: visible` trên phần text làm tràn khung. Chỉ `clip` nơi thiết kế chủ định; không che lỗi bằng `overflow: hidden` khi chữ vẫn sai vị trí.
- Media nặng chỉ play/render gần viewport; poster/fallback local đúng khung. Không autoplay audio. Loop mượt, tránh frame đen/flash khi route transition. Nếu dùng `<video>`, đảm bảo `muted`, `playsInline`, poster, preload hợp lý và cleanup observer; nếu dùng WebGL, áp dụng lifecycle tương tự.

## 7. Kỹ thuật và tiêu chuẩn code

- Giữ Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 và convention repo. Đọc docs package đang cài cho API liên quan. Không để `any`, lỗi hydration, console error, warning media hay missing assets. Có thể dùng CSS Modules hiện tại; tách component, animation controller, data và asset rõ ràng.
- Thay đổi toàn site một cách có kiểm soát: ưu tiên refactor các component đang có; đặt tên `Noir…` cho component/data mới nếu hữu ích, không cần rename hàng loạt namespace cũ trong một lần gây gãy import. Xóa đường tham chiếu asset Nordå trong runtime sau khi chuyển. Không xoá thư mục asset cũ trước khi chắc chắn không còn ai dùng.
- Thiết lập một nguồn sự thật cho brand strings, nav, project/service data, contact destination, assets. Không hardcode nội dung NOIR lặp khắp component. Asset logo/motion mới phục vụ local dưới `public/` với tên dễ hiểu; ghi provenance và quyền sử dụng.
- Không dùng iframe Eventide hoặc YouTube, screenshot nguyên trang, video tải lậu, CSS filter đặt lên footage nước, gradient tròn sơ sài hoặc một vòng sáng giả làm “black hole realistic”. Nếu fidelity/hiệu năng buộc có tradeoff, thực hiện phương án tốt nhất và ghi rõ giới hạn thật.
- Nếu không có địa chỉ nhận contact hoặc ảnh logo đủ rõ, xử lý các phần khác tới mức hoàn chỉnh; ở điểm không thể suy luận, hỏi **một câu cụ thể** về dữ liệu cần thiết. Không dừng toàn bộ dự án ở giai đoạn plan.

## 8. QA bắt buộc, có bằng chứng

1. Chụp baseline và bản sau ở desktop 1440×900, laptop 1280×800, tablet 768×1024, mobile 390×844 và ít nhất một màn 320px. Với intro và section cinematic, chụp keyframes 0/25/50/75/100% (và frame phát sinh bug) ở cùng viewport/scroll progress. So side-by-side với Eventide/video **chỉ ở các khía cạnh được dùng làm tham chiếu**, và với ảnh 1/2 của user cho bug/frame.
2. Test đường đi: truy cập `/` mới; `/about` → logo Home; `/projects` → menu Home; `/contact` → footer Home; Back/Forward; refresh ở giữa section; bấm Back to top; deep link; cuộn lên/xuống nhanh. Sau mỗi đường đi, hero bắt đầu/scroll restore đúng, section cinematic không nhảy sai frame, logo/header không biến mất trái ý.
3. Đo tự động các invariant hữu ích: không có horizontal overflow; text của statement nằm trong viewport/container tại mọi keyframe; `getBoundingClientRect` không giao cắt với header/menu ngoài các chồng lớp chủ định; không có element bị opacity 0 nhưng vẫn focusable; không có asset 404; tất cả internal links hợp lệ. Viết test cho hồi quy route/scroll **vì bug này có tính tái xuất**, không viết test chỉ lặp lại implementation.
4. Kiểm tra keyboard/focus, reduced motion, WebGL off/context loss nếu có thể, CPU/GPU load thực tế, FPS/long task ở desktop và mobile, layout shift khi font/media load. Thiết kế ưu tiên thời gian tải hợp lý; giảm chất lượng render có kiểm soát trên DPR cao/mobile. Không hy sinh hình ảnh desktop chỉ để đạt một con số benchmark máy móc.
5. Chạy `npm run lint`, `npm run typecheck`, `npm run build`, các QA script phù hợp trong `package.json`; sửa lỗi do thay đổi này. Nếu test cũ chứa assertion Nordå, cập nhật theo yêu cầu NOIR thay vì bỏ test. Không báo pass khi chưa chạy.
6. `rg` toàn bộ app/runtime cho brand/architecture cũ và URL nguồn không mong muốn. Phân biệt URL tham chiếu trong research với runtime request. Kiểm tra tab title, favicon, OG, alt, aria, sitemap/footer và cả route ít thấy.

### Tiêu chí chấp nhận không thương lượng

- Khi bấm về homepage, **không bao giờ** có tình trạng chữ trắng khổng lồ nằm tràn/chồng lên frame như ảnh 1; bố cục section ở state tương ứng gọn và cân như ảnh 2, nay mang NOIR/black-hole media.
- Mọi logo thương hiệu cũ đã được thay bằng dấu NOIR từ ảnh 3; không còn dòng Nordå hoặc ngành kiến trúc trong UI công khai.
- Intro đầu trang thể hiện chiều sâu 3D/ánh sáng/lensing thuyết phục, scroll điều khiển camera/timeline trơn và có thể cuộn ngược; mobile và reduced-motion vẫn hoàn chỉnh.
- Section nước được thay bằng nghiên cứu hố đen lấy video YouTube đã chỉ định làm tham chiếu, có poster/fallback/loop hoặc renderer phù hợp, không dựa vào YouTube/Framer runtime.
- Website nói rõ NOIR nhận dự án website, ứng dụng, cloud/code; CTA dẫn tới đường liên hệ thực tế hoặc trạng thái trung thực. Không có giải thưởng/khách hàng/dự án bịa.
- Build sạch, route chính dùng được, không có console error và có ảnh QA cho từng mốc.

## 9. Cách thực hiện và báo cáo cuối

Làm việc theo các checkpoint có commit/ghi chú rõ: (A) baseline và research, (B) brand/content/routes, (C) hero 3D, (D) cinematic frame và fix lỗi homepage, (E) responsive/performance/QA. Có thể sắp lại nếu dependency đòi hỏi, nhưng **không dừng ở checkpoint A**. Ở mỗi checkpoint chụp/kiểm tra app đang chạy.

Khi hoàn tất, báo cáo ngắn mà cụ thể: nguyên nhân gốc của lỗi ảnh 1 và cách sửa; file/component chính đã đổi; giải pháp 3D/media và lý do; logo/asset lấy từ đâu, giới hạn quyền sử dụng; route/nội dung nào đã cập nhật; các lệnh kiểm tra đã chạy và kết quả; đường dẫn ảnh so sánh; những chênh lệch thị giác hoặc dữ liệu NOIR còn cần người dùng cung cấp. Không tuyên bố “pixel perfect” hay “100% giống video” nếu chưa chứng minh bằng visual QA.

# MASTER PROMPT — END
