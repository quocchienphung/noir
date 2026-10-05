# NOIR — prompt sửa chất lượng black hole 3D cho Claude Code

Ngày soạn: 05/10/2026. Phạm vi: nâng cấp hình ảnh và chuyển động nội tại của black hole trong app hiện có. Scroll đã được người dùng chấp nhận.

## Cách dùng

Mở Claude Code ở thư mục gốc repo và gửi:

```text
Đọc toàn bộ prompt/NOIR_BLACK_HOLE_REBUILD_PROMPT.md và thực thi phần MASTER PROMPT. Đây là tác vụ nâng cấp black hole trong code hiện có, không phải làm lại website. Xem video tham chiếu, đọc shader/renderer hiện tại, triển khai scene 3D realtime, kiểm chứng bằng hình ảnh và chuyển động. Giữ hành vi scroll hiện tại. Không dùng video/image sequence thay renderer. Không dừng ở phân tích hay kế hoạch.
```

File này là prompt tiếp nối, ưu tiên cho tác vụ black hole so với các yêu cầu media cũ trong `NOIR_CLAUDE_MASTER_PROMPT.md`. Không chạy lại toàn bộ cuộc chuyển đổi Nordå → NOIR. Các ảnh người dùng gửi trong yêu cầu ngày 05/10 là **hiện trạng chưa đạt**, không phải ảnh đích. Cách đánh số ảnh trong prompt master cũ không áp dụng cho yêu cầu này.

## Cơ sở đã kiểm tra khi soạn

- Đã đọc `shaders.ts`, `renderer.ts`, `scenes.ts`, `BlackHoleCanvas.tsx`, `NoirIntro.tsx`, `NoirCinematic.tsx`, `useScrollTimeline.ts`, CSS canvas, route `/` và các mục media của prompt cũ.
- Đã mở trực tiếp [video tham chiếu của Kalakaar FX](https://www.youtube.com/watch?v=784dsKVrdjQ), quan sát frame ở 0:15 và kiểm tra thêm đoạn quanh 0:45. Chưa đo định lượng đầy đủ optical flow, màu hoặc thông số camera của video; không được coi các mô tả dưới đây là phép đo chính xác.
- Đã xem `docs/design-references/noir/gargantua-video/yt-45.jpg` và `yt-90.jpg`. **Ảnh `yt-90.jpg` đang chứa vòng loading**; không dùng làm bằng chứng frame 1:30 đã tải hoàn chỉnh. Các ảnh cũ phải kiểm tra lại, không tin timestamp chỉ từ tên file.
- Các chẩn đoán dưới đây phân biệt điều đọc thấy trong code, dấu hiệu trong screenshot, và giả thuyết cần thử nghiệm. Chưa chạy profiler hay ablation để kết luận mọi nguyên nhân.

---

# MASTER PROMPT — BEGIN

Bạn là senior graphics engineer chuyên WebGL/GLSL, technical artist và người chịu trách nhiệm visual QA. Hãy sửa trực tiếp black hole của website NOIR hiện tại thành một scene 3D realtime có chất lượng điện ảnh, bám sát video người dùng chỉ định. **Người dùng không hài lòng với texture, các sợi sáng, lensing và cảm giác vật chất bị hút vào trong; họ đã hài lòng với animation scroll.**

## 1. Kết quả phải đạt và giới hạn phạm vi

Tham chiếu chính: `https://www.youtube.com/watch?v=784dsKVrdjQ` — *Interstellar Gargantua Black Hole | 1 Hour Full HD Live Wallpaper*, Kalakaar FX.

Mục tiêu của người dùng là giống video 100%. Hiểu đây là yêu cầu fidelity tối đa: phải đối chiếu silhouette, texture, ánh sáng, độ dày đĩa, vùng tối, lensing và chuyển động. Không tự diễn giải thành “một black hole đẹp theo ý mình”. Cũng không tuyên bố đạt 100% khi chưa chứng minh: video nén, scene procedural và camera hero khác nhau không cho phép tự suy ra phần trăm giống. Báo cáo cụ thể phần khớp và phần còn lệch.

Các điều bắt buộc:

1. Dựng scene bằng mô hình không gian 3D và shader chạy realtime. Camera, trường khí, ánh sáng bị bẻ cong và sự che khuất phải nhất quán trong không gian.
2. Không YouTube iframe, `<video>`, MP4/WebM, animated WebP/GIF, footage trên `VideoTexture`, chuỗi ảnh theo scroll, ảnh toàn cảnh dán lên plane rồi zoom, hay render sẵn từng góc camera thay scene thực.
3. Texture nguyên liệu tự tạo, noise, density/flow map và bảng tra lensing được phép nếu chúng là dữ liệu đầu vào của renderer 3D, không phải các frame hoàn chỉnh của video. Ghi cách tạo, seed, định dạng và nơi sử dụng.
4. Ray-traced scene procedural hiện tại là một dạng dựng 3D hợp lệ dù pass cuối dùng fullscreen triangle. Không bắt buộc tạo `.glb`, không thêm torus/sphere chỉ để có mesh. Nếu dùng mesh hoặc volume thì phải giải quyết lensing; Three.js mặc định không tự bẻ cong ánh sáng.
5. Giữ layout, nội dung, logo, header, CTA, thứ tự section, sticky track, thời điểm reveal, scroll smoothing và hướng camera chuyển cảnh đã được chấp nhận. Chỉ chỉnh framing/look trong phạm vi cần thiết cho hình ảnh; lưu baseline để chứng minh không làm hỏng hành vi.
6. Không phát sinh rebrand, làm lại contact/projects, clone Eventide, thêm trang demo vào sản phẩm hoặc thay toàn bộ engine vô cớ.
7. Poster chỉ dùng khi đang tải, WebGL không khả dụng hoặc fallback accessibility thích hợp. Poster phải do scene mới tạo ra; không dùng ảnh chụp YouTube và không cố ý ép máy có WebGL về poster để qua QA.

## 2. Ba trạng thái phải cùng được sửa

Repo có **hai scene**, không phải ba renderer độc lập. Cách hiểu ba ảnh của yêu cầu mới:

| Trạng thái cần kiểm tra | Component/scene | Yêu cầu |
| --- | --- | --- |
| Hero đầu trang có “Digital experiences.” / “Built with depth.” | `NoirIntro`, `scene="dive"` | Giữ bố cục chữ, gauge, CTA và hành trình dive; sửa đĩa đang trông như các vòng đồng tâm, màu cam quá đều, viền nhỏ đứt hạt và vật chất thiếu chiều sâu |
| Khung cinematic bo góc có NOIR mark ở giữa | `NoirCinematic`, `scene="cinematic"`, framed | Giữ clip/frame/mark theo timeline; sợi sáng, chi tiết khí và độ sáng phải đẹp ngay cả ở kích thước khung |
| Cinematic mở rộng gần toàn màn hình, đĩa nghiêng | Cùng `NoirCinematic`, expanding/open | Chất lượng phải đứng vững khi phóng lớn; không lộ lưới noise, răng cưa, vòng dây đều nhau hoặc đổi texture đột ngột |

Không copy ba scene gần giống nhau. Dùng chung model/material/flow, với preset camera và look có kiểm soát. Hình thể và chất khí của video là chuẩn chung; hero cần giữ framing để đọc chữ. Đối chiếu chính xác góc video bằng một camera QA riêng trong chế độ development, không ép hero mang crop lệch phải của video.

## 3. Đọc đúng code hiện tại trước khi sửa

Đọc `AGENTS.md`, `CLAUDE.md` nếu có, `package.json` và tài liệu liên quan trong `node_modules/next/dist/docs/` trước khi viết code Next.js. Kiểm tra git status, giữ các sửa đổi sẵn có của người dùng. Không reset hoặc khôi phục file bị người dùng xoá.

| File | Vai trò và điểm cần đọc |
| --- | --- |
| `src/lib/noir/blackhole/shaders.ts` | `TRACE_FRAG`, `shadeDisk`, `tn`, tích phân tia, capture/escape, bloom và `COMPOSITE_FRAG` |
| `src/lib/noir/blackhole/renderer.ts` | noise seed, texture sampling, framebuffer HDR, pass bloom, uniform, resize và dispose |
| `src/lib/noir/blackhole/scenes.ts` | `DIVE_DISK`, `CINEMATIC_DISK`, `diveFrame`, `cinematicFrame`, camera, look và fade |
| `src/components/noir/BlackHoleCanvas.tsx` | vòng render, quality budget, step count, DPR, pause, reduced motion, context recovery |
| `src/components/noir/NoirIntro.tsx` | DOM và scroll driver hero; giữ hành vi |
| `src/components/noir/NoirCinematic.tsx` | frame, clip, logo, statement và scroll driver; giữ hành vi |
| `src/components/noir/useScrollTimeline.ts` | giữ contract progress và smoothing; không viết lại chỉ vì đổi shader |
| `src/lib/noir/cinematic-timeline.ts` | giữ các state và thời điểm chuyển trạng thái |
| `src/styles/noir/{black-hole,intro,cinematic}.module.css` | canvas/poster sizing, scrim, opacity, scale và clipping ảnh hưởng hình cuối |
| `tests/qa-{visual,scroll,routes,independence}.mjs` | đọc yêu cầu môi trường và assertion trước khi chạy/cập nhật |
| `docs/research/noir/`, `docs/design-references/noir/` | dùng nghiên cứu cũ làm đầu mối, kiểm tra lại kết luận trước khi kế thừa |

### Những điều đã thấy trong code — phải giải quyết có bằng chứng

- `shadeDisk` lấy giao điểm với mặt phẳng `y=0`; chưa có trường mật độ hữu hạn theo chiều cao. Đây là mô hình thin disk, không tự cho bề mặt khí có độ dày và self-occlusion như người dùng mong muốn.
- `lanes`/`threads` lấy noise theo `ln(r)` với các tần số 2.2, 4.6, 1.1, 6.0. Các nét dài theo quỹ đạo dễ nổi thành vòng xếp lớp nếu thiếu cấu trúc đa tỉ lệ và biến thiên cục bộ. Ảnh người dùng cho thấy dấu hiệu này; phải kiểm tra bằng render tắt từng lớp.
- `omega = uFlow * pow(r, -1.5)` xoay pattern theo bán kính; `lnr = log(r)` không có advection hướng vào trong. Đừng báo đã có dòng hút inward chỉ vì texture đang quay hoặc camera đang tiến gần.
- Hai phase noise crossfade có `period = 24.0`. Kiểm tra xem có cảm giác pattern tan/chồng rồi sinh lại, hoặc thay tương phản gần mốc phase; không mặc định đây là flow vật chất liên tục.
- Pixel footprint hiện tại xấp xỉ từ travel/grazing angle, `aaBase` có bias `-0.8` cố ý giữ nét subpixel. Noise mip lại được tăng contrast theo `exp2(lod)`. Đây là các nghi phạm của moiré và hạt rung, chưa phải kết luận đã đo.
- Tích phân đang là cập nhật `nv = v + acc * dt; np = p + nv * dt`, với `dt = clamp(0.065*r, 0.012, 1.4)`. Comment ghi phương trình geodesic “exact” không đồng nghĩa solver số hiện tại cho kết quả hội tụ hoặc chính xác ở photon ring.
- Nếu hết step budget mà chưa capture/escape, shader vẫn cộng background với hệ số 0.6. Kiểm tra riêng các pixel chưa hội tụ; không để branch này tạo viền giả hay ánh sáng trong vùng lẽ ra bị capture.
- `BlackHoleCanvas` có `PIXEL_BUDGET = 650_000`, `MIN_SCALE = 0.32`, DPR tối đa 1.5; steps là 170/200/220 theo số pixel. Ở viewport lớn, ảnh đang được upscale đáng kể. Chất lượng tích phân còn thay đổi cùng resolution. Phải đo buffer thật, không gọi ảnh viewport 2560px là native render 2560px.
- `DIVE_DISK.hot = [1, 0.7, 0.34]`, warm khá cam; composite trộn hue-preserving tonemap với trọng số 0.6. Đây là các điểm cần chỉnh nếu highlight cứ thành vàng/cam thay vì trắng nóng của video; không chỉ tăng exposure.
- Grain hiện là 0.035/0.03 theo preset. Kiểm tra ở output thực: grain quá mạnh có thể biến khí thành vải/sạn và nâng vùng tối. Không dùng grain để che lỗi sampling.
- Ảnh có một vòng sáng mảnh bên trong vùng tối, trông tách rời và đứt hạt. Không mặc định đó là mesh thừa: kiểm tra ảnh bậc cao của disk, shadow boundary, step budget, alpha, filtering và màu trước khi quyết định cách sửa. Không xoá sạch photon ring bằng một vòng mask CSS.

Đối với compositing, kiểm tra `col += (1-alpha) * d.rgb` cùng cập nhật alpha. Quy định rõ `d.rgb` là integrated emission/premultiplied radiance hay straight color; tránh nhân alpha hai lần hoặc để contribution không tuân theo transmittance. Dùng scene chẩn đoán đơn giản để kiểm chứng, không đổi công thức chỉ theo cảm giác.

## 4. Nghiên cứu video và lập spec thị giác

Xem video thật, không chỉ thumbnail. Kiểm tra frame sạch ở 0:00, 0:15, 0:45, 1:30 và một đoạn phát liên tục ít nhất 10–15 giây. Các mốc là kế hoạch kiểm tra, không được ghi đã xem khi chưa xem. Đợi seek tải xong; không lưu loading spinner, controls hay frame cũ rồi gắn timestamp mới.

Quan sát đã có để định hướng, cần đo lại:

- Khối tối lớn lệch phải; đĩa sáng đi từ dưới trái lên phải. Đỉnh cung có thể bị crop trong khung video; không mặc định hố đen luôn nằm trọn giữa hình.
- Nút giao phía trái giữa đĩa và cung lensing rất sáng, trắng/ngà; các dải ngoài chuyển kem, đồng và nâu tối. Vùng trắng nóng phải có gradient chuyển tiếp, không phải tất cả đều vàng cam.
- Bề mặt đĩa có mảng khí sáng tối không đều, các búi/vệt kéo dài, khoảng tối và filament nhỏ. Nó không phải hàng trăm sợi chỉ cùng độ dày chạy song song từ đầu đến cuối.
- Cung trên và ảnh phía dưới có độ sáng, độ rộng, độ nén và chi tiết khác nhau. Không dùng hai nửa vòng tròn đối xứng có cùng material.
- Có quầng quang học mịn quanh vùng chói, nhưng black-hole shadow vẫn đọc rõ. Nguồn phát sáng là khí bên ngoài; không làm lõi tối tự phát sáng.
- Video có một vật thể nhỏ bên trái khối tối. Ghi nhận để mask khỏi phép so sánh black-hole-only; không tự thêm vật thể trang trí đó vào hero NOIR.

Ghi spec trong `docs/research/noir/BLACK_HOLE_REBUILD.md`: timestamp, vùng crop, aspect ratio, độ phân giải media, trung tâm shadow, bán kính tương đối, góc đĩa, độ dày band, độ rộng cung trên/dưới, vùng highlight, palette và mức grain. Phân biệt số đo với ước lượng. Lưu reference sạch và before/after dưới `docs/design-references/noir/black-hole-rebuild/`.

Không kéo giãn reference để ép khớp. Khi so renderer với video, dùng cùng camera/aspect/crop và mask UI/vật thể phụ. Khi so các trạng thái website, so với baseline để giữ layout và scroll. Đây là hai bài kiểm tra khác nhau.

## 5. Mô hình ánh sáng, shadow và lensing

Phải phân biệt rõ ba thứ: chân trời sự kiện là ranh giới capture; shadow là vùng ảnh tối mà observer thấy; photon ring/lensed disk images là ánh sáng có đường đi bị bẻ cong. Chúng không phải một hình tròn phát sáng duy nhất. Tham khảo [NASA — Black Hole Anatomy](https://science.nasa.gov/universe/black-holes/anatomy/) để dùng thuật ngữ đúng; không biến website thành bài trình diễn khoa học.

Giữ hoặc nâng cấp ray tracing thật: ray từ camera đi qua trường hấp dẫn, sample cùng disk/volume ở các đường đi thích hợp, tích luỹ emission/transmittance, dừng khi capture hoặc escape. Cung trên/dưới phải phát sinh từ cùng vật chất được lensing, không phải ellipse phát sáng dựng thêm sau lưng.

- Đánh giá solver bằng ảnh hội tụ: giảm bước, tăng budget và so shadow boundary/cung/disk crossing ở cùng frame. Dùng integrator bậc cao hoặc bước thích nghi nếu có lợi đo được; không coi tăng steps toàn màn hình là lời giải duy nhất.
- Kiểm tra plane/volume intersections, thứ tự near/far, sai số gần critical rays, self-intersection, ray termination và singularity guards. Pixel chưa hội tụ phải có cách xử lý rõ ràng.
- Nếu chuyển sang LUT/beam tracing, tham khảo [Eric Bruneton — A Real-time High-quality Black Hole Shader](https://ebruneton.github.io/black_hole_shader/): đây là hướng bảng tra cho tia cong và filtering, không phải footage. Đọc phương pháp, kiểm tra phạm vi camera, precision và license trước khi dùng code. Không sao chép cả demo.
- Schwarzschild có thể đủ cho look cần đạt. Không tự nhận đang mô phỏng Kerr chỉ vì reference mang tên Gargantua; chỉ thêm spin nếu chứng minh lợi ích hình ảnh và khả thi hiệu năng. Chất lượng phải được đánh giá bằng hình, không bằng tên mô hình.
- Shadow không có sao/khí từ sau xuyên qua. Emission từ vật chất phía trước có thể che một phần silhouette; không tô một đĩa đen screen-space lên cuối để xoá cả foreground hợp lệ.
- Bloom có thể lan nhẹ từ vành sáng vào vùng tối như hiệu ứng quang học. Tách việc này khỏi phát xạ sai trong shadow khi debug.

## 6. Texture phải thành khí nóng, không còn vòng dây

Xây trường density/emission liên tục trong disk/object/world space, có seed ổn định. Nếu giữ thin disk có nâng cấp shading, phải chứng minh được cảm giác chiều dày ở các góc hiện tại; nếu không đạt, dùng disk slab có chiều cao hữu hạn hoặc volume có giới hạn vùng sample. Không bắt buộc volumetric raymarch đắt tiền toàn viewport.

Texture cần đủ ba tầng:

1. **Tầng lớn:** envelope theo bán kính, độ dày khí, các miền dày/mỏng không đều và bright mass phân bố cục bộ. Không đối xứng hoàn hảo, không lặp hình lốp xe.
2. **Tầng vừa:** turbulence/domain warp có hướng, mảng sáng tối bị shear theo quỹ đạo, voids và knots có chiều dài khác nhau. Tạo cảm giác các luồng khí bị kéo, không phải noise trắng trải lên bề mặt.
3. **Tầng nhỏ:** filament mảnh, ngắt quãng hữu cơ, thay đổi độ rộng và độ sáng; chi tiết dưới pixel phải được lọc, không biến thành zigzag/chấm trắng.

Các tầng phải cùng chuyển động theo flow. Không dùng một lớp noise bất động phía dưới và các đường phát sáng trượt vô can phía trên. Không làm toàn bộ pattern “sôi” ngẫu nhiên theo time hoặc reset seed mỗi frame.

Đĩa có viền trong chuyển tiếp đúng look, mép ngoài tan dần, chiều cao thay đổi mềm theo bán kính và density. Tương phản nội bộ phải còn ở vùng trung sáng. Cho phép vùng chói cục bộ gần trắng như reference; không clip trắng cả đĩa hoặc làm mọi chi tiết đều sắc nét như khắc kim loại.

## 7. Yêu cầu trọng tâm: các luồng sáng có cảm giác bị hút vào trong

Không hiểu câu “line ánh sáng bị hấp thụ vào chân trời” thành chùm laser vẽ trực tiếp vào tâm đen. Về hình ảnh cần phối hợp **khí phát sáng dịch chuyển**, **ảnh của nó bị bẻ cong**, **che khuất/capture**. Tia sáng không cần hiện thành đường quỹ đạo như sơ đồ vật lý.

Thiết kế flow với cả tốc độ góc và vận tốc hướng tâm:

- Ngoài xa: khí chủ yếu quay, drift vào trong chậm; các lớp bán kính có vận tốc khác nhau để tạo shear.
- Gần vùng trong: một số dải khí có chuyển động inward nhận biết được, co hẹp và kéo dài; không đồng loạt hút mọi điểm trên đĩa vào tâm như xoáy nước.
- Phân biệt stable disk với plunging region nếu mô hình có vùng đó. Chỉ thêm emission bên trong inner edge theo một profile rõ, cường độ phù hợp reference; không kéo toàn bộ disk sáng đến horizon bằng cách xoá inner cutoff.
- Advection density phải thực sự dịch vào bán kính nhỏ hơn theo thời gian. Sampling noise với UV dịch có thể dùng, nhưng phải kiểm tra đúng dấu bằng debug marker: chiều dịch UV có thể ngược chiều chuyển động hình ảnh.
- Theo dõi một knot hoặc vệt sáng qua nhiều frame: nó đi trên bề mặt khí, bị shear, đổi hình liên tục, rồi bị che khuất/tắt dần theo vận chuyển bức xạ hoặc capture. Không bật/tắt theo tuổi ngẫu nhiên ngay trên screen-space.
- Không bắt mọi đường nhìn thấy kết thúc ở đúng tâm hình tròn. Các nhánh lensed, đường khuất và foreground có hình chiếu khác nhau; kết thúc phải khớp đường đi của ray.
- Tránh hard respawn, seam ở `atan`, discontinuity ở vòng 2π, đổi seed, đổi pattern hoặc pulse độ sáng tại mốc loop. Nếu giữ crossfade phase, chứng minh không có ghost hai pattern/morph mất khối.

Tách hai thời gian: **scroll progress điều khiển camera/transition hiện có**, **simulation time điều khiển khí**. Khi người dùng đứng yên, khí vẫn chảy chậm. Khi scroll ngược, camera đảo đúng nhưng khí không tự quay ngược vì progress giảm. Reduced motion vẫn cho một frame chất lượng cao và tuân thủ cơ chế accessibility hiện tại.

Vận tốc inward là tham số art direction phải được tinh chỉnh theo quan sát video; không bịa rằng đã đo tốc độ vật lý từ clip. Nếu video chỉ thể hiện rất nhẹ, giữ subtle. Người dùng muốn thấy cảm giác hút có chiều sâu, không yêu cầu phóng đại thành hiệu ứng sci-fi khác hẳn reference.

## 8. Màu, phát sáng và hậu kỳ

Thực hiện shading trong linear HDR và một pipeline tone mapping/output rõ ràng. Kiểm tra màu input texture/uniform đang ở không gian nào, tránh gamma hai lần. Không thêm nhiều pass colour correction bù nhau mà không có baseline.

- Highlight thật nóng: trắng/ngà, transition sang champagne/đồng nhạt và nâu tối. Chọn RGB từ reference sau khi cân nhắc nén/tonemap; không coi mã màu nhìn bằng mắt là phép đo exact.
- Density, nhiệt độ, opacity và emission là các đại lượng có liên quan nhưng không cùng một slider. Dải sáng nhất không được cứ tăng saturation cam.
- Doppler/beaming tạo bất đối xứng có kiểm soát theo góc nhìn. Không mặc định preset 0.95 là đúng chỉ vì nghe “vật lý hơn”; video có thể được art-direct.
- Bloom mềm quanh vùng chói, giữ cấu trúc medium-frequency và biên shadow đọc được. Tune threshold, radius, gain cùng exposure; không tăng bloom để giấu vòng dây.
- Grain nhẹ, xem riêng ở full size và clip chuyển động; tắt grain khi đo AA/lensing. Nền tối không biến thành màn sương nâu đục đều toàn màn hình.
- Logo NOIR là lớp DOM hiện có; không cho nó phát sáng hoặc bẻ cong trong model mới nếu không có yêu cầu. Mask logo khi chấm chất lượng shadow.

## 9. Chống alias và giữ chất lượng khi scroll/resize

Đánh giá đồng thời radial, azimuthal và biến dạng do lensing. Footprint chỉ dựa vào khoảng cách và góc grazing có thể thiếu magnification tại critical rays. Chọn ray differentials, finite differences, beam footprint hoặc phương pháp filter có lý do phù hợp renderer.

- Không dùng `fwidth`/derivatives một cách ngây thơ trong vòng raymarch có nhánh phân kỳ rồi mặc định kết quả đáng tin. Nếu dùng derivatives, bảo đảm vị trí tính hợp lệ và kiểm thử vùng biên.
- Áp dụng mip/anisotropic-aware filtering và giới hạn tần số theo footprint; ưu tiên texture ổn định khi chuyển động hơn nét giả dưới pixel.
- Nếu dùng jitter/temporal accumulation, history cần reset/reproject đúng khi camera/progress/size/context đổi. Không để vệt ma, ring kéo đuôi, bôi chi tiết hoặc ghost khi scroll ngược.
- Tách chất lượng tích phân tia, sampling texture, resolution và bloom. Không để đổi dynamic resolution làm méo shadow/cung sáng vì step budget đổi theo không kiểm soát.
- Kiểm tra high-quality deterministic mode ở gần/native resolution để phân biệt lỗi shader với upscale. Đây là chế độ QA, không phải cách che production đang xấu.
- Sửa có mục tiêu các đoạn sợi bị thành chuỗi hạt/đường gãy, răng cưa và moiré. Không dùng CSS blur toàn canvas như giải pháp chính.

## 10. Tích hợp, hiệu năng và lifecycle

Ưu tiên giữ WebGL2 renderer hiện tại nếu đủ khả năng. Chỉ đổi engine khi có lý do cụ thể và không làm hỏng React/Next/lifecycle. Không thêm R3F/Three.js/postprocessing chỉ để thay API mà hình vẫn như cũ.

Gom tham số thành config có nghĩa: radial drift, orbital speed, turbulence scale, domain warp, filament width, disk thickness, inner emission, optical depth, highlight temperature, beaming, exposure, bloom, grain và quality tier. Ghi đơn vị/range/default của các tham số thực sự có triển khai; tránh các magic number rải rác và slider không tác dụng. Dev controls không xuất hiện trong UI production.

- Giữ render theo ref/RAF, tránh React setState mỗi frame. Reuse GPU resource, không cấp framebuffer/noise mỗi frame.
- Giữ pause khi offscreen/tab ẩn, context recovery, disposal và reduced motion. Không tạo hai loop điều khiển cùng canvas.
- Simulation clock sau khi pause phải có chính sách rõ để không nhảy phase lớn khi quay lại. Freeze time/camera/seed độc lập được trong QA.
- Đo frame time, buffer resolution và quality tier trên thiết bị thực. Mục tiêu khoảng 60 fps desktop, 30 fps mobile là mục tiêu kỹ thuật, không phải kết quả được phép báo khi chưa đo. Ghi GPU/browser/viewport/DPR và median/p95; nếu GPU timer không có, phân biệt RAF timing với GPU time.
- Chế độ giảm chất lượng vẫn giữ silhouette, shadow, chuyển động và chất khí cơ bản; giảm chi tiết nhỏ/sample phù hợp. Không hạ xuống ảnh tĩnh rồi gọi đó là realtime.
- Không hy sinh look desktop chỉ vì benchmark headless đang chạy software renderer. Kiểm tra Chrome có tăng tốc GPU khi đánh giá chất lượng/hiệu năng.

## 11. Trình tự thực hiện bắt buộc

1. **Baseline:** chạy app, xác định port thực, chụp cả ba trạng thái ở cùng viewport/pointer; ghi scroll progress, buffer size, seed/time và quality. Lưu console errors có sẵn. Đọc script test để biết yêu cầu server/port trước khi chạy.
2. **Reference/spec:** xem video, ghi thông số đo/ước lượng, tạo ảnh đối chiếu và danh sách khác biệt theo ưu tiên. Không dành toàn bộ tác vụ cho research.
3. **Ablation:** tạo debug mode development bật/tắt grain, bloom, texture nhỏ, background; xem capture/escape/unresolved, disk UV/density, radiance trước tonemap. Chẩn đoán vòng sáng nhỏ và banding bằng evidence.
4. **Lensing/shape:** sửa vấn đề hội tụ/giao điểm/compositing đã xác minh, chốt shadow/cung và layering ở camera tham chiếu trước.
5. **Material/flow:** triển khai cấu trúc khí đa tỉ lệ và inward advection; kiểm tra time đứng yên camera, sau đó camera thay đổi.
6. **Look:** cân màu/HDR/bloom/filtering theo video; đưa cùng model về hero, framed cinematic và open cinematic.
7. **Performance:** profile, tối ưu các phần đắt nhất; sau mỗi giảm quality phải so lại ảnh và motion.
8. **Regression/QA:** chạy kiểm tra code, kiểm tra route/scroll, capture before/after và đoạn animation; sửa cho tới khi các tiêu chí quan trọng đạt. Không dừng ở screenshot duy nhất trông “tạm đẹp”.

Nếu một thay đổi không cải thiện hình hoặc gây hồi quy, bỏ riêng thay đổi đó, không reset công việc người dùng. Nếu công cụ không đọc được video, dùng frame tham chiếu sạch có sẵn cho phần tĩnh, tiếp tục sửa các lỗi xác định được, và ghi rõ phần motion chưa kiểm chứng; không tưởng tượng đã xem clip.

## 12. Visual QA và tiêu chí nghiệm thu

Tạo ma trận capture có metadata, không chỉ một thư mục ảnh không nhãn:

- Desktop: 1440×900 và 2560×1440; laptop 1280×800; mobile 390×844. Bổ sung kích thước thật gần screenshot người dùng nếu lấy được. Không lấy cả taskbar làm viewport.
- Intro: progress 0, 0.25, 0.5, 0.75, gần mốc fade; cinematic: framed, giữa expansion, fully open và trước statement che media. Lấy mốc đúng từ timeline hiện tại.
- Freeze camera/time/seed để so before/after. Sau đó kiểm tra animation liên tục tối thiểu 30 giây, đủ đi qua mốc 24 giây nếu phase cũ vẫn tồn tại; quan sát tốc độ thường, chậm và scroll hai chiều.
- So riêng crop của shadow edge, upper arc, lower arc, giao điểm chói và bề mặt outer disk ở kích thước 1:1. Toàn cảnh đẹp không bù được texture lỗi khi nhìn gần.

### Gate thị giác

| Gate | Đạt khi | Không đạt khi |
| --- | --- | --- |
| Hình thể/lensing | Shadow và các nhánh disk nhất quán với góc camera; đạt cấu trúc reference | Đen tròn + torus phát sáng; hai cung đối xứng tuỳ tiện |
| Texture | Có khối khí, khoảng tối, shear, filament hữu cơ và độ dày hợp lý | Vòng dây, đĩa than, vải dệt, rãnh máy, noise phẳng |
| Dòng hút | Theo dõi được vệt/knot chuyển vào trong và biến mất đúng layering | Chỉ xoay noise/zoom camera, các laser hướng tâm, pop theo lifetime |
| Shadow/ring | Không xuyên background; viền sáng ổn định, có lý do quang học | Vòng nét mảnh đứt hạt treo trong lòng shadow, răng cưa rung |
| Ánh sáng | White-hot cục bộ, ngà/đồng/nâu có chiều sâu, bloom giữ cấu trúc | Cam đồng đều, neon, glow mờ đục, tất cả cháy trắng |
| Temporal | Motion liên tục, không seam/phase flash/history ghost | Pattern morph/respawn, glitter mạnh, vòng rung khi đứng yên |
| Ba trạng thái | Cùng chất lượng model/material khi framed/open/dive | Chỉ cinematic đẹp hoặc chỉ render QA đẹp |
| Runtime | Canvas thật, camera có ảnh hưởng không gian, asset tự chủ | Footage, sequence, screenshot, WebGL lỗi nhưng poster che hết |
| Scroll | Giữ nhịp, state, reverse scroll, logo/copy như baseline | Đổi thời điểm transition, giật/pin sai, chữ/mark che sai |

Có thể đặt dung sai ban đầu cho camera QA khớp reference: tâm shadow sai lệch ≤1% kích thước frame, đường kính shadow sai lệch ≤3%, góc đĩa lệch ≤2°. Đây là **mục tiêu đề xuất để đo**, không phải số đo đã có hoặc định nghĩa “100%”. Với feature bị crop phải ghi cách fit và độ tin cậy. Không ép các dung sai này lên hero có composition được giữ riêng.

Không dùng SSIM toàn ảnh làm chứng cứ duy nhất: vùng đen lớn dễ che sai biệt, texture procedural không đồng bộ từng hạt với footage. Nếu dùng metric thì cần crop/mask/camera matching và giải thích phạm vi; luôn có review motion và feature-level.

Chạy `npm run lint`, `npm run typecheck`, `npm run build`; chạy `qa:scroll`, `qa:routes`, `qa:independence`, `qa:visual` phù hợp sau khi chuẩn bị server. Test có ý nghĩa cho hội quy thực: viewport/resize, navigation về Home, context loss/recovery, scroll hai chiều. Nếu thêm numerical test, kiểm tra solver hội tụ/capture invariant thay vì chỉ snapshot chính implementation.

Kiểm tra trực tiếp fresh `/`, route khác → Home/logo, Back/Forward, reload giữa cinematic, resize, reduced motion và WebGL fallback. Kiểm tra `data-status="live"`/canvas thật, shader compile log, asset 404 và network không tải footage bên ngoài. Cập nhật poster từ scene mới nếu thay look.

## 13. Bàn giao

Code phải chạy trong trang `/` hiện tại. Bàn giao kèm:

- Ghi chú ngắn nguyên nhân đã chứng minh của cảm giác “fake”, thay đổi tương ứng và lý do chọn giải pháp.
- File model/shader/renderer/config đã đổi, nguồn texture/LUT và cách tái tạo.
- Bộ before/after cho cả ba trạng thái, crop so reference và clip chứng minh flow khi camera đứng yên.
- Kết quả các lệnh đã chạy, console, performance có điều kiện đo; phân biệt rõ chưa chạy/không đo được.
- Các chênh lệch còn lại so video. Không tự cấp điểm “100%”, không nói “pixel perfect” vì build xanh hoặc vì dùng thuật ngữ geodesic.

**Nhắc lại ý định của tôi:** giữ trải nghiệm scroll đã ổn, dựng lại chất khí và lensing của black hole bằng 3D realtime; các vệt sáng phải có chuyển động, sức nặng và cảm giác bị hút thuyết phục. Không làm đẹp bằng video, không thêm vòng neon, không dừng ở đổi màu/bloom. Hoàn thành implementation và tự kiểm chứng hình ảnh.

# MASTER PROMPT — END
